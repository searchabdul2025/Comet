import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ChatMessage from '@/models/ChatMessage';
import ChatBan from '@/models/ChatBan';
import { getChatLimits } from '@/lib/chatSettings';
import { checkRateLimit } from '@/lib/chatRateLimit';
import { broadcast } from '@/lib/chatStream';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const limits = await getChatLimits();

    const [messagesRaw, ban] = await Promise.all([
      ChatMessage.find({ chatroomId: null }) // Only main team chat messages
        .sort({ createdAt: -1 })
        .limit(limits.historyLimit)
        .lean(),
      user.role === 'Admin'
        ? null
        : ChatBan.findOne({ userId: user.id, active: true }).lean<{ reason?: string }>(),
    ]);

    const messages = messagesRaw.reverse().map((msg) => ({
      ...msg,
      _id: (msg as any)._id?.toString?.() ?? '',
      createdAt: (msg as any).createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        messages,
        ban: ban ? { reason: ban.reason || null } : null,
        limits,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const limits = await getChatLimits();

    if (user.role !== 'Admin') {
      const ban = (await ChatBan.findOne({ userId: user.id, active: true }).lean<{ reason?: string }>()) || null;
      if (ban) {
        return NextResponse.json(
          { success: false, error: ban.reason || 'You are banned from chat.' },
          { status: 403 }
        );
      }

      const rateCheck = checkRateLimit(user.id, limits.rateLimitPerMinute);
      if (!rateCheck.ok) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please wait a moment.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const content = (body?.content || '').toString().trim();

    if (!content) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const safeContent = content.slice(0, limits.maxMessageLength);

    const message = await ChatMessage.create({
      userId: user.id,
      userName: user.name || user.email || 'Unknown User',
      userRole: user.role,
      content: safeContent,
      chatroomId: null, // Main team chat
      isSystem: false,
    });

    const payload = {
      _id: message._id.toString(),
      userId: message.userId,
      userName: message.userName,
      userRole: message.userRole,
      content: message.content,
      createdAt: message.createdAt,
      isSystem: message.isSystem,
    };

    broadcast({ type: 'message', message: payload });

    return NextResponse.json({ success: true, data: payload }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


