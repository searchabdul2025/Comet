import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ChatMessage from '@/models/ChatMessage';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'Admin' && user.role !== 'Supervisor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    // Fetch recent non-management messages from main chat for oversight
    const messages = await ChatMessage.find({ isManagement: false, chatroomId: null })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ 
      success: true, 
      messages: messages 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
