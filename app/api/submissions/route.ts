import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import Form from '@/models/Form';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canViewSubmissions', user.permissions as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || '500'), 2000);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const userId = searchParams.get('userId');
    const campaignId = searchParams.get('campaignId');

    const match: any = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23, 59, 59, 999);
        match.createdAt.$lte = dt;
      }
    }
    if (userId) {
      match.submittedBy = userId;
    }

    await connectDB();

    if (campaignId) {
      const forms = await Form.find({ campaign: campaignId }).select('_id').lean();
      const formIds = forms.map((f: any) => f._id);
      // If no forms belong to this campaign, short-circuit to empty result
      if (formIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      match.formId = { $in: formIds };
    }

    // Exclude deleted submissions
    match.deleted = { $ne: true };

    const submissions = await FormSubmission.find(match)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: submissions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

