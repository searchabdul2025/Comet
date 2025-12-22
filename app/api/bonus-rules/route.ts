import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import BonusRule from '@/models/BonusRule';
import mongoose from 'mongoose';

// GET all bonus rules
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const campaignId = searchParams.get('campaignId');

    await connectDB();

    const query: any = {};
    if (userId) query.user = userId;
    if (campaignId) query.campaign = campaignId;

    const rules = await BonusRule.find(query)
      .populate('user', 'name email username role')
      .populate('campaign', 'name campaignId')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bonus rules' },
      { status: 500 }
    );
  }
}

// POST create new bonus rule
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, campaignId, productGrade, bonusAmount, target, note, isActive } = body;

    if (!userId || !campaignId || !productGrade || typeof bonusAmount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, campaignId, productGrade, bonusAmount' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID or campaign ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if rule already exists
    const existing = await BonusRule.findOne({
      user: userId,
      campaign: campaignId,
      productGrade: productGrade.trim(),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Bonus rule already exists for this user, campaign, and product grade' },
        { status: 400 }
      );
    }

    const rule = await BonusRule.create({
      user: userId,
      campaign: campaignId,
      productGrade: productGrade.trim(),
      bonusAmount,
      target: target || undefined,
      note: note || '',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: user.id,
    });

    const populated = await BonusRule.findById(rule._id)
      .populate('user', 'name email username role')
      .populate('campaign', 'name campaignId')
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bonus rule' },
      { status: 500 }
    );
  }
}

