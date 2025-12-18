import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import ChatBan from '@/models/ChatBan';
import { broadcast } from '@/lib/chatStream';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !requirePermission(admin.role as any, 'canManageUsers', admin.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const ban = await ChatBan.findOneAndUpdate(
      { userId: params.userId },
      { active: false, liftedAt: new Date() },
      { new: true }
    );

    if (!ban) {
      return NextResponse.json({ success: false, error: 'Ban not found' }, { status: 404 });
    }

    broadcast({ type: 'unban', userId: params.userId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


