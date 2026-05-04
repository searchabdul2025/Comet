import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RequestModel from '@/models/Request';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

// GET all requests (admin/supervisor with canManageRequests)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const canManageAll = requirePermission(user.role as any, 'canManageRequests', user.permissions as any);
    const query = canManageAll ? {} : { requester: user.id };
    const q = RequestModel.find(query)
      .populate('requester', 'name email')
      .sort({ createdAt: -1 });
    if (canManageAll) {
      q.populate('reviewedBy', 'name email');
    }
    const requests = await q.lean();

    const data = requests.map((r: any) => ({
      id: r._id?.toString?.() || '',
      type: r.type,
      details: r.details,
      title: r.title,
      name: r.name,
      description: r.description,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
      requester: r.requester
        ? {
            id: r.requester._id?.toString?.() || '',
            name: r.requester.name,
            email: r.requester.email,
          }
        : null,
      reviewedBy: r.reviewedBy
        ? {
            id: r.reviewedBy._id?.toString?.() || '',
            name: r.reviewedBy.name,
            email: r.reviewedBy.email,
          }
        : null,
      reviewedAt: r.reviewedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST create a request (any authenticated user)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const type = (body?.type || '').toString().trim();
    const details = (body?.details || '').toString().trim();
    const title = (body?.title || '').toString().trim();
    const name = (body?.name || '').toString().trim();
    const description = (body?.description || '').toString().trim();
    const message = (body?.message || '').toString().trim();

    if (!type || !details) {
      return NextResponse.json(
        { success: false, error: 'Type and details are required' },
        { status: 400 }
      );
    }

    const created = await RequestModel.create({
      type,
      details,
      title,
      name,
      description,
      message,
      requester: user.id,
      status: 'Pending',
    });

    const populated = await RequestModel.findById(created._id)
      .populate('requester', 'name email')
      .lean();

    if (!populated || Array.isArray(populated)) {
      return NextResponse.json(
        { success: false, error: 'Failed to load created request' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: populated?._id?.toString?.() || '',
          type: populated?.type,
          details: populated?.details,
          title: populated?.title,
          name: populated?.name,
          description: populated?.description,
          message: populated?.message,
          status: populated?.status,
          createdAt: populated?.createdAt,
          requester: populated?.requester
            ? {
                id: populated.requester._id?.toString?.() || '',
                name: populated.requester.name,
                email: populated.requester.email,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create request' },
      { status: 500 }
    );
  }
}

