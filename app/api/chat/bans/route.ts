import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import ChatBan from '@/models/ChatBan';
import User from '@/models/User';
import { broadcast } from '@/lib/chatStream';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const bans = await ChatBan.find({ active: true }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: bans.map((ban) => ({
        ...ban,
        _id: (ban as any)._id?.toString?.() ?? '',
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !requirePermission(admin.role as any, 'canManageUsers', admin.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const userId = (body?.userId || '').toString();
    const reason = (body?.reason || '').toString();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();
    const target = await User.findById(userId).lean<{ role?: string; name?: string; email?: string; username?: string }>();
    if (!target) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (target.role === 'Admin') {
      return NextResponse.json({ success: false, error: 'Cannot ban an admin' }, { status: 400 });
    }

    const ban = await ChatBan.findOneAndUpdate(
      { userId },
      {
        userId,
        userName: target.name || target.email || target.username || 'User',
        reason: reason || 'Banned by administrator',
        bannedBy: admin.id,
        bannedByName: admin.name || admin.email || 'Admin',
        active: true,
        liftedAt: null,
      } as any,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    broadcast({ type: 'ban', ban: { userId: ban.userId, reason: ban.reason || null } });

    return NextResponse.json({
      success: true,
      data: {
        _id: ban._id.toString(),
        userId: ban.userId,
        userName: ban.userName,
        reason: ban.reason,
        bannedBy: ban.bannedBy,
        bannedByName: ban.bannedByName,
        createdAt: ban.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


