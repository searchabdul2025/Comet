import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ChatMessage from '@/models/ChatMessage';
import { broadcast } from '@/lib/chatStream';

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Delete all messages that are not system messages
    await ChatMessage.deleteMany({ chatroomId: null });

    // Broadcast clear event
    broadcast({ type: 'clear_chat' });

    return NextResponse.json({ success: true, message: 'Chat cleared successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
