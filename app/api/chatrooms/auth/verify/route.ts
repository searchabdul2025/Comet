import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import ChatRoomCredential from '@/models/ChatRoomCredential';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('chatroom_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    try {
      const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());

      await connectDB();

      // Verify chatroom exists and is active
      const chatroom = await ChatRoom.findById(sessionData.chatroomId).lean();
      if (!chatroom || !(chatroom as any).isActive) {
        return NextResponse.json({ success: false, error: 'Chatroom not found or inactive' }, { status: 404 });
      }

      // Verify credential exists and is active
      const credential = await ChatRoomCredential.findById(sessionData.credentialId).lean();
      if (!credential || !(credential as any).isActive) {
        return NextResponse.json({ success: false, error: 'Credential not found or inactive' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          chatroom: {
            _id: sessionData.chatroomId,
            name: (chatroom as any).name,
            description: (chatroom as any).description,
          },
          user: {
            username: sessionData.username,
            displayName: sessionData.displayName,
          },
        },
      });
    } catch (parseError) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Verification failed' }, { status: 500 });
  }
}

