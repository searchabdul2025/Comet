import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RequestModel from '@/models/Request';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return params instanceof Promise ? await params : params;
}

// PATCH update status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageRequests', user.permissions as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await resolveParams(params);
    await connectDB();
    const body = await request.json();
    const status = (body?.status || '').toString().trim();

    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be Approved or Rejected' },
        { status: 400 }
      );
    }

    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
      { new: true }
    )
      .populate('requester', 'name email')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!updated || Array.isArray(updated)) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated._id?.toString?.() || '',
        type: updated.type,
        details: updated.details,
        status: updated.status,
        createdAt: updated.createdAt,
        requester: updated.requester
          ? {
              id: updated.requester._id?.toString?.() || '',
              name: updated.requester.name,
              email: updated.requester.email,
            }
          : null,
        reviewedBy: updated.reviewedBy
          ? {
              id: updated.reviewedBy._id?.toString?.() || '',
              name: updated.reviewedBy.name,
              email: updated.reviewedBy.email,
            }
          : null,
        reviewedAt: updated.reviewedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update request' },
      { status: 500 }
    );
  }
}

