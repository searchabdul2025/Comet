import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import BonusRule from '@/models/BonusRule';
import mongoose from 'mongoose';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return params instanceof Promise ? await params : params;
}

// GET single bonus rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await resolveParams(params);

    await connectDB();
    const rule = await BonusRule.findById(id)
      .populate('user', 'name email username role')
      .populate('campaign', 'name campaignId')
      .populate('createdBy', 'name email')
      .lean();

    if (!rule) {
      return NextResponse.json({ success: false, error: 'Bonus rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bonus rule' },
      { status: 500 }
    );
  }
}

// PUT update bonus rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await resolveParams(params);
    const body = await request.json();
    const { productGrade, bonusAmount, target, note, isActive } = body;

    await connectDB();

    const updates: any = {};
    if (productGrade !== undefined) updates.productGrade = productGrade.trim();
    if (typeof bonusAmount === 'number') updates.bonusAmount = bonusAmount;
    if (target !== undefined) updates.target = target || null;
    if (note !== undefined) updates.note = note || '';
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    const updated = await BonusRule.findByIdAndUpdate(id, updates, { new: true })
      .populate('user', 'name email username role')
      .populate('campaign', 'name campaignId')
      .populate('createdBy', 'name email')
      .lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Bonus rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update bonus rule' },
      { status: 500 }
    );
  }
}

// DELETE bonus rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await resolveParams(params);

    await connectDB();
    const deleted = await BonusRule.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Bonus rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Bonus rule deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete bonus rule' },
      { status: 500 }
    );
  }
}

