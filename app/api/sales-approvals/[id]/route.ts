import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SalesApproval from '@/models/SalesApproval';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

// GET - Get single sales approval
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = params instanceof Promise ? await params : params;

    const approval = await SalesApproval.findById(id)
      .populate('agent', 'name email username')
      .populate('submission', 'formId phoneNumber formData createdAt')
      .populate('reviewedBy', 'name email username')
      .lean() as any;

    if (!approval) {
      return NextResponse.json({ success: false, error: 'Approval not found' }, { status: 404 });
    }

    // Check permissions - agents can only see their own
    const User = (await import('@/models/User')).default;
    const dbUser = await User.findOne({ email: user.email }).lean() as any;
    if (dbUser?.role === 'User' && approval.agent && approval.agent.toString() !== dbUser._id.toString()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: approval });
  } catch (error: any) {
    console.error('Get sales approval error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sales approval' },
      { status: 500 }
    );
  }
}

// PUT - Update sales approval (only admin/supervisor)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const User = (await import('@/models/User')).default;
    const dbUser = await User.findOne({ email: user.email }).lean() as any;

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Only Admin and Supervisor can update
    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'Supervisor') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only admins and supervisors can update sales approvals' },
        { status: 403 }
      );
    }

    const { id } = params instanceof Promise ? await params : params;
    const body = await request.json();
    const { status, comments, amount } = body;

    const updateData: any = {
      reviewedBy: dbUser._id,
      reviewedAt: new Date(),
    };

    if (status && ['pending', 'approved', 'rejected', 'paid', 'unpaid'].includes(status)) {
      updateData.status = status;
    }

    if (comments !== undefined) {
      updateData.comments = comments || null;
    }

    if (amount !== undefined) {
      updateData.amount = amount || null;
    }

    const approval = await SalesApproval.findByIdAndUpdate(id, updateData, { new: true })
      .populate('agent', 'name email username')
      .populate('submission', 'formId phoneNumber formData createdAt')
      .populate('reviewedBy', 'name email username')
      .lean();

    if (!approval) {
      return NextResponse.json({ success: false, error: 'Approval not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: approval });
  } catch (error: any) {
    console.error('Update sales approval error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update sales approval' },
      { status: 500 }
    );
  }
}

// DELETE - Delete sales approval (only admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const User = (await import('@/models/User')).default;
    const dbUser = await User.findOne({ email: user.email }).lean() as any;

    if (!dbUser || dbUser?.role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only admins can delete sales approvals' },
        { status: 403 }
      );
    }

    const { id } = params instanceof Promise ? await params : params;
    await SalesApproval.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete sales approval error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete sales approval' },
      { status: 500 }
    );
  }
}

