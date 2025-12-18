import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmployeeLead from '@/models/EmployeeLead';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'Supervisor' && user.role !== 'Admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const resolved = params instanceof Promise ? await params : params;
    const id = resolved.id;
    const body = await req.json();
    const decision = body?.decision as 'approved' | 'rejected';
    const note = body?.note as string | undefined;

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ success: false, error: 'Invalid decision' }, { status: 400 });
    }
    if (decision === 'rejected' && !note?.trim()) {
      return NextResponse.json({ success: false, error: 'Rejection note is required' }, { status: 400 });
    }

    await connectDB();
    const lead = await EmployeeLead.findById(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // upsert approval for this role
    const existingIdx = lead.approvals.findIndex((a: any) => a.role === user.role);
    const approvalEntry = {
      role: user.role as 'Supervisor' | 'Admin',
      decision,
      note,
      decidedBy: user.id,
      decidedAt: new Date(),
    };
    if (existingIdx >= 0) {
      lead.approvals[existingIdx] = approvalEntry as any;
    } else {
      lead.approvals.push(approvalEntry as any);
    }

    // status resolution: any rejection -> Rejected, else any approval -> Approved, else Pending
    const hasRejection = lead.approvals.some((a: any) => a.decision === 'rejected');
    const hasApproval = lead.approvals.some((a: any) => a.decision === 'approved');
    lead.status = hasRejection ? 'Rejected' : hasApproval ? 'Approved' : 'Pending';

    await lead.save();
    await lead.populate('employee', 'name email');

    return NextResponse.json({ success: true, data: lead });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update lead' },
      { status: 500 }
    );
  }
}

