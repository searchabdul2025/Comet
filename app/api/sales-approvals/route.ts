import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SalesApproval from '@/models/SalesApproval';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import mongoose from 'mongoose';

// GET - List sales approvals (filtered by role)
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');

    const match: any = {};

    // Agents can only see their own approvals
    if (dbUser?.role === 'User') {
      match.agent = dbUser._id;
    } else {
      // Admin/Supervisor can see all, but can filter by agent
      if (agentId) {
        match.agent = new mongoose.Types.ObjectId(agentId);
      }
      // If supervisor, check if they have permission to view submissions
      if (dbUser?.role === 'Supervisor') {
        const canView = requirePermission(
          dbUser.role as any,
          'canViewSubmissions',
          dbUser.permissions as any
        );
        if (!canView) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    if (status) {
      match.status = status;
    }

    const approvals = await SalesApproval.find(match)
      .populate('agent', 'name email username')
      .populate('submission', 'formId phoneNumber formData createdAt')
      .populate('reviewedBy', 'name email username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: approvals });
  } catch (error: any) {
    console.error('Get sales approvals error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sales approvals' },
      { status: 500 }
    );
  }
}

// POST - Create sales approval (auto-created when submission is made, or manually by admin)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { submissionId, amount, status = 'pending' } = body;

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Submission ID is required' }, { status: 400 });
    }

    // Check if approval already exists
    const existing = await SalesApproval.findOne({ submission: submissionId }).lean();
    if (existing) {
      return NextResponse.json({ success: false, error: 'Approval already exists for this submission' }, { status: 400 });
    }

    // Get submission to find the agent
    const submission = await FormSubmission.findById(submissionId).lean() as any;
    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    const agentId = submission?.submittedBy || dbUser?._id;

    const approval = await SalesApproval.create({
      agent: agentId,
      submission: submissionId,
      status,
      amount: amount || undefined,
    });

    const populated = await SalesApproval.findById(approval._id)
      .populate('agent', 'name email username')
      .populate('submission', 'formId phoneNumber formData createdAt')
      .lean();

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    console.error('Create sales approval error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create sales approval' },
      { status: 500 }
    );
  }
}

