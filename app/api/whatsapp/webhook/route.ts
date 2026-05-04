import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';
import { broadcastToChatroom } from '@/lib/chatStream';

export const runtime = 'nodejs';

// WhatsApp Verification Handshake
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // Verify challenge
  if (mode === 'subscribe' && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid verification request' }, { status: 400 });
}

// Receive incoming WhatsApp Messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages && change.value.messages.length > 0) {
            const message = change.value.messages[0];
            const contact = change.value.contacts?.[0];
            const from = message.from; // Phone number
            const text = message.text?.body || '[Non-text message]';
            const userName = contact?.profile?.name || from;

            await connectDB();

            // Find user by whatsappNumber
            let user = await User.findOne({ whatsappNumber: from });
            
            let chatRoomId;

            if (user) {
              // Find their personal 1-on-1 chatroom
              let chatRoom = await ChatRoom.findOne({
                 visibility: 'private',
                 allowedUsers: user._id
              });

              if (!chatRoom) {
                 const admin = await User.findOne({ role: 'Admin' });
                 chatRoom = await ChatRoom.create({
                   name: `${user.name} (WhatsApp)`,
                   description: 'WhatsApp linked private chat',
                   createdBy: admin ? admin._id : user._id,
                   visibility: 'private',
                   allowedUsers: [user._id],
                   showInSidebar: true,
                 });
              }
              chatRoomId = chatRoom._id;
            } else {
              // Create guest user or just map to a general WhatsApp support room
              const admin = await User.findOne({ role: 'Admin' });
              let chatRoom = await ChatRoom.findOne({ name: 'WhatsApp Support' });
              
              if (!chatRoom) {
                chatRoom = await ChatRoom.create({
                   name: `WhatsApp Support`,
                   description: 'General WhatsApp inquiries',
                   createdBy: admin?._id,
                   visibility: 'public',
                   showInSidebar: true,
                });
              }
              chatRoomId = chatRoom._id;
            }

            // Save message to CRM
            const newMessage = await ChatMessage.create({
              userId: user ? user._id.toString() : `wa_${from}`,
              userName: user ? user.name : userName,
              userRole: user ? user.role : 'User',
              content: text,
              chatroomId: chatRoomId,
            });

            if (chatRoomId) {
              const payload = {
                _id: newMessage._id.toString(),
                userId: newMessage.userId,
                userName: newMessage.userName,
                userRole: newMessage.userRole,
                content: newMessage.content,
                chatroomId: chatRoomId,
                createdAt: newMessage.createdAt,
                isSystem: newMessage.isSystem,
              };
              broadcastToChatroom(chatRoomId.toString(), { type: 'message', message: payload });
            }
          }
        }
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ success: false }, { status: 404 });
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
