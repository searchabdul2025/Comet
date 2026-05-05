import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ChatMessage from '@/models/ChatMessage';
import { getChatLimits } from '@/lib/chatSettings';
import { broadcastToChatroom } from '@/lib/chatStream';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'Admin' && user.role !== 'Supervisor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const messages = await ChatMessage.find({ isManagement: true })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ 
      success: true, 
      messages: messages.reverse() 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'Admin' && user.role !== 'Supervisor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const content = (body?.content || '').toString().trim();

    if (!content) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    await connectDB();
    const limits = await getChatLimits();

    const message = await ChatMessage.create({
      userId: user.id,
      userName: user.name || user.email || 'Management User',
      userRole: user.role,
      content: content.slice(0, limits.maxMessageLength),
      isManagement: true,
      chatroomId: null,
    });

    const payload = {
      _id: message._id.toString(),
      userId: message.userId,
      userName: message.userName,
      userRole: message.userRole,
      content: message.content,
      createdAt: message.createdAt,
      isManagement: true,
    };

    broadcastToChatroom('management', { type: 'message', message: payload });

    return NextResponse.json({ success: true, message: payload });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
