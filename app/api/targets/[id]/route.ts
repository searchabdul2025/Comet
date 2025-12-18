import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import Target from '@/models/Target';
import FormSubmission from '@/models/FormSubmission';
import { getSetting } from '@/lib/settings';

function getMonthRange(period: string) {
  const [yearStr, monthStr] = period.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

async function loadBonusConfig() {
  const [perSubmission, onTarget] = await Promise.all([
    getSetting('BONUS_PER_SUBMISSION'),
    getSetting('BONUS_TARGET_BONUS'),
  ]);
  return {
    perSubmission: Number(perSubmission || 0),
    onTarget: Number(onTarget || 0),
  };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const target = await Target.findById(params.id).populate('user', 'name email username role').lean();
    if (!target) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const bonusCfg = await loadBonusConfig();
    const { start, end } = getMonthRange(target.period);
    const achieved = await FormSubmission.countDocuments({
      submittedBy: target.user,
      createdAt: { $gte: start, $lte: end },
    });
    const bonus = achieved * bonusCfg.perSubmission + (achieved >= target.target ? bonusCfg.onTarget : 0);
    const completion = target.target > 0 ? Math.min(100, Math.round((achieved / target.target) * 100)) : 0;

    return NextResponse.json({
      success: true,
      data: { ...target, achieved, bonus, completion },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch target' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { period, target, note } = body || {};

    if (period && !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json({ success: false, error: 'Period must be YYYY-MM' }, { status: 400 });
    }

    await connectDB();

    const updates: any = {};
    if (period) updates.period = period;
    if (typeof target === 'number') updates.target = target;
    if (typeof note === 'string') updates.note = note;

    const updated = await Target.findByIdAndUpdate(params.id, updates, { new: true }).populate(
      'user',
      'name email username role'
    );
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const bonusCfg = await loadBonusConfig();
    const targetPeriod = updated.period;
    const { start, end } = getMonthRange(targetPeriod);
    const achieved = await FormSubmission.countDocuments({
      submittedBy: updated.user,
      createdAt: { $gte: start, $lte: end },
    });
    const targetValue = typeof updated.target === 'number' ? updated.target : 0;
    const bonus = achieved * bonusCfg.perSubmission + (targetValue && achieved >= targetValue ? bonusCfg.onTarget : 0);
    const completion = targetValue > 0 ? Math.min(100, Math.round((achieved / targetValue) * 100)) : 0;

    return NextResponse.json({
      success: true,
      data: { ...(updated.toObject?.() || updated), achieved, bonus, completion },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update target' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    await Target.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete target' }, { status: 500 });
  }
}

