import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import Target from '@/models/Target';
import FormSubmission from '@/models/FormSubmission';
import { getSetting } from '@/lib/settings';
import mongoose from 'mongoose';

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

    // Ensure targetUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const targetDoc = await Target.findOne({ 
      user: new mongoose.Types.ObjectId(targetUserId), 
      period 
    }).lean();
    
    const { start, end } = getMonthRange(period);

    // Total submissions (submitted)
    const submitted = await FormSubmission.countDocuments({
      submittedBy: new mongoose.Types.ObjectId(targetUserId),
      createdAt: { $gte: start, $lte: end },
    });

    // Achieved submissions (currently same as submitted, but can be filtered later)
    const achieved = submitted;

    const bonusCfg = await loadBonusConfig();
    const targetValue = (!targetDoc || Array.isArray(targetDoc)) ? 0 : (targetDoc as any)?.target ?? 0;
    const bonus = achieved * bonusCfg.perSubmission + (targetValue && achieved >= targetValue ? bonusCfg.onTarget : 0);
    const completion = targetValue > 0 ? Math.min(100, Math.round((achieved / targetValue) * 100)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        period,
        target: targetValue,
        submitted,
        achieved,
        bonus,
        completion,
        targetId: (!targetDoc || Array.isArray(targetDoc)) ? null : targetDoc._id || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load summary' }, { status: 500 });
  }
}

