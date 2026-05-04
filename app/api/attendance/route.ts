import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AttendanceRecord from '@/models/AttendanceRecord';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions as any)) {
      // For now, only users with user management permissions (Admins) can view all attendance
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');
    const userId = req.nextUrl.searchParams.get('userId');

    const match: any = {};

    if (from || to) {
      match.checkInTime = {};
      if (from) match.checkInTime.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23, 59, 59, 999);
        match.checkInTime.$lte = dt;
      }
    }

    if (userId) {
      match.userId = userId;
    }

    await connectDB();

    const records = await AttendanceRecord.find(match)
      .populate('userId', 'name email role biometricId')
      .sort({ checkInTime: -1 })
      .lean();

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
