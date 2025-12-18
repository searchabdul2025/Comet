import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Achievement from '@/models/Achievement';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const search = req.nextUrl.searchParams;
    const month = search.get('month') || undefined;
    const requestedEmployee = search.get('employeeId') || undefined;
    const isAdmin = user.role === 'Admin';
    const isSupervisor = user.role === 'Supervisor';

    const match: any = {};
    if (month) match.month = month;
    if (isAdmin || isSupervisor) {
      if (requestedEmployee) match.employee = requestedEmployee;
    } else {
      match.employee = user.id;
    }

    await connectDB();
    const rows = await Achievement.find(match).sort({ month: -1 }).limit(200);
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load achievements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const month = body?.month as string;
    const isAdmin = user.role === 'Admin';
    const isSupervisor = user.role === 'Supervisor';
    const employeeId = (isAdmin || isSupervisor) && body?.employeeId ? body.employeeId : user.id;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ success: false, error: 'Month must be in YYYY-MM format' }, { status: 400 });
    }

    await connectDB();
    const payload = {
      targets: body?.targets ?? null,
      achieved: body?.achieved ?? null,
      remaining: body?.remaining ?? null,
      revenue: body?.revenue ?? null,
      bonuses: body?.bonuses ?? null,
      dealsClosed: body?.dealsClosed ?? null,
      dealsRejected: body?.dealsRejected ?? null,
      notes: body?.notes ?? '',
    };

    const doc = await Achievement.findOneAndUpdate(
      { employee: employeeId, month },
      { ...payload, employee: employeeId, month },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to save achievement' }, { status: 500 });
  }
}

