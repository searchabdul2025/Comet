import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import Target from '@/models/Target';
import FormSubmission from '@/models/FormSubmission';
import { calculateBonusForUser } from '@/lib/bonusCalculation';

function getMonthRange(period: string) {
  const [yearStr, monthStr] = period.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period');
    const userId = searchParams.get('userId');

    await connectDB();

    const query: any = {};
    if (period) query.period = period;
    if (userId) query.user = userId;

    const targets = await Target.find(query)
      .populate('user', 'name email username role')
      .sort({ period: -1 })
      .lean();

    const enriched = await Promise.all(
      targets.map(async (t: any) => {
        const { start, end } = getMonthRange(t.period);
        const achieved = await FormSubmission.countDocuments({
          submittedBy: t.user,
          createdAt: { $gte: start, $lte: end },
        });
        // Calculate bonus using granular bonus rules
        const bonus = await calculateBonusForUser(t.user, t.period, t.target);
        const completion = t.target > 0 ? Math.min(100, Math.round((achieved / t.target) * 100)) : 0;
        return { ...t, achieved, bonus, completion };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch targets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, period, target, note } = body || {};

    if (!userId || !period || typeof target !== 'number') {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json({ success: false, error: 'Period must be YYYY-MM' }, { status: 400 });
    }

    await connectDB();

    const existing = await Target.findOne({ user: userId, period });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Target already exists for this user and month' }, { status: 400 });
    }

    const created = await Target.create({
      user: userId,
      period,
      target,
      note: note || '',
      createdBy: user.id,
    });

    const { start, end } = getMonthRange(period);
    const achieved = await FormSubmission.countDocuments({
      submittedBy: userId,
      createdAt: { $gte: start, $lte: end },
    });
    // Calculate bonus using granular bonus rules
    const bonus = await calculateBonusForUser(userId, period, target);
    const completion = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
    const populated = await created.populate('user', 'name email username role');

    return NextResponse.json({
      success: true,
      data: { ...(populated.toObject?.() || populated), achieved, bonus, completion },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create target' }, { status: 500 });
  }
}

