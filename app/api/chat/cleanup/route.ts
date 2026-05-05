import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getSetting } from '@/lib/settings';
import ChatMessage from '@/models/ChatMessage';

export async function GET() {
  try {
    await connectDB();
    const autoDeleteHours = parseInt(await getSetting('CHAT_AUTO_DELETE_HOURS') || '0');

    if (autoDeleteHours <= 0) {
      return NextResponse.json({ success: true, message: 'Auto-delete is disabled.' });
    }

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - autoDeleteHours);

    const result = await ChatMessage.deleteMany({
      createdAt: { $lt: cutoffDate },
      isSystem: { $ne: true } // Keep system messages? (usually yes, for logs)
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate.toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
