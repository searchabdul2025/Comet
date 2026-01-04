import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import ChatRoom from '@/models/ChatRoom';
import ChatRoomCredential from '@/models/ChatRoomCredential';
import { getChatLimits } from '@/lib/chatSettings';
import { broadcastToChatroom } from '@/lib/chatStream';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return params instanceof Promise ? await params : params;
}

// Helper to get chatroom session from cookie
async function getChatroomSession(request: NextRequest) {
  const token = request.cookies.get('chatroom_token')?.value;
  if (!token) return null;

  try {
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());
    return sessionData;
  } catch {
    return null;
  }
}

// GET: Fetch messages for a chatroom
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await resolveParams(params);
    const session = await getChatroomSession(request);

    if (!session || session.chatroomId !== id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Verify chatroom exists and is active
    const chatroom = await ChatRoom.findById(id).lean();
    if (!chatroom || !(chatroom as any).isActive) {
      return NextResponse.json({ success: false, error: 'Chatroom not found or inactive' }, { status: 404 });
    }

    // Verify credential exists and is active
    const credential = await ChatRoomCredential.findById(session.credentialId).lean();
    if (!credential || !(credential as any).isActive) {
      return NextResponse.json({ success: false, error: 'Credential not found or inactive' }, { status: 404 });
    }

    const limits = await getChatLimits();

    // Fetch messages for this chatroom only
    const messagesRaw = await ChatMessage.find({ chatroomId: id })
      .sort({ createdAt: -1 })
      .limit(limits.historyLimit)
      .lean();

    const messages = messagesRaw.reverse().map((msg: any) => ({
      _id: msg._id?.toString() ?? '',
      userId: msg.userId,
      userName: msg.userName,
      userRole: msg.userRole,
      content: msg.content,
      createdAt: msg.createdAt,
      isSystem: msg.isSystem || false,
    }));

    return NextResponse.json({
      success: true,
      data: {
        messages,
        limits,
        chatroom: {
          _id: id,
          name: (chatroom as any).name,
          description: (chatroom as any).description,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: Send message to a chatroom
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await resolveParams(params);
    const session = await getChatroomSession(request);

    if (!session || session.chatroomId !== id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Verify chatroom exists and is active
    const chatroom = await ChatRoom.findById(id).lean();
    if (!chatroom || !(chatroom as any).isActive) {
      return NextResponse.json({ success: false, error: 'Chatroom not found or inactive' }, { status: 404 });
    }

    // Verify credential exists and is active
    const credential = await ChatRoomCredential.findById(session.credentialId).lean();
    if (!credential || !(credential as any).isActive) {
      return NextResponse.json({ success: false, error: 'Credential not found or inactive' }, { status: 404 });
    }

    const limits = await getChatLimits();
    const body = await request.json();
    const content = (body?.content || '').toString().trim();

    if (!content) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const safeContent = content.slice(0, limits.maxMessageLength);

    const message = await ChatMessage.create({
      userId: session.credentialId,
      userName: session.displayName || session.username,
      userRole: 'User', // Chatroom users are treated as regular users
      content: safeContent,
      chatroomId: id,
      isSystem: false,
    });

    const payload = {
      _id: message._id.toString(),
      userId: message.userId,
      userName: message.userName,
      userRole: message.userRole,
      content: message.content,
      chatroomId: id,
      createdAt: message.createdAt,
      isSystem: message.isSystem,
    };

    // Broadcast to this specific chatroom
    broadcastToChatroom(id, { type: 'message', message: payload });

    return NextResponse.json({ success: true, data: payload }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to send message' }, { status: 500 });
  }
}

