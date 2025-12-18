import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import Target from '@/models/Target';
import FormSubmission from '@/models/FormSubmission';
import { getSetting } from '@/lib/settings';

function getCurrentPeriod() {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || getCurrentPeriod();
    const userIdParam = searchParams.get('userId');

    const targetUserId =
      userIdParam && requirePermission(user.role as any, 'canManageUsers', user.permissions)
        ? userIdParam
        : user.id;

    await connectDB();

    const targetDoc = await Target.findOne({ user: targetUserId, period }).lean();
    const { start, end } = getMonthRange(period);

    const achieved = await FormSubmission.countDocuments({
      submittedBy: targetUserId,
      createdAt: { $gte: start, $lte: end },
    });

    const bonusCfg = await loadBonusConfig();
    const targetValue = targetDoc?.target ?? 0;
    const bonus = achieved * bonusCfg.perSubmission + (targetValue && achieved >= targetValue ? bonusCfg.onTarget : 0);
    const completion = targetValue > 0 ? Math.min(100, Math.round((achieved / targetValue) * 100)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        period,
        target: targetValue,
        achieved,
        bonus,
        completion,
        targetId: targetDoc?._id || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load summary' }, { status: 500 });
  }
}

