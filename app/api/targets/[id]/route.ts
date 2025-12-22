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

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const target = await Target.findById(id).populate('user', 'name email username role').lean();
    if (!target || Array.isArray(target)) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const { start, end } = getMonthRange(target.period as string);
    const achieved = await FormSubmission.countDocuments({
      submittedBy: target.user,
      createdAt: { $gte: start, $lte: end },
    });
    // Calculate bonus using granular bonus rules
    const bonus = await calculateBonusForUser(target.user, target.period as string, target.target);
    const completion = target.target > 0 ? Math.min(100, Math.round((achieved / target.target) * 100)) : 0;

    return NextResponse.json({
      success: true,
      data: { ...target, achieved, bonus, completion },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch target' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
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

    const updated = await Target.findByIdAndUpdate(id, updates, { new: true }).populate(
      'user',
      'name email username role'
    );
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const targetPeriod = updated.period;
    const { start, end } = getMonthRange(targetPeriod);
    const achieved = await FormSubmission.countDocuments({
      submittedBy: updated.user,
      createdAt: { $gte: start, $lte: end },
    });
    const targetValue = typeof updated.target === 'number' ? updated.target : 0;
    // Calculate bonus using granular bonus rules
    const bonus = await calculateBonusForUser(updated.user, targetPeriod, targetValue);
    const completion = targetValue > 0 ? Math.min(100, Math.round((achieved / targetValue) * 100)) : 0;

    return NextResponse.json({
      success: true,
      data: { ...(updated.toObject?.() || updated), achieved, bonus, completion },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update target' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    await Target.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete target' }, { status: 500 });
  }
}

