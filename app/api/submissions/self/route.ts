import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import FormSubmission from '@/models/FormSubmission';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || '200'), 1000);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const match: any = { submittedBy: user.id };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23, 59, 59, 999);
        match.createdAt.$lte = dt;
      }
    }

    await connectDB();

    const submissions = await FormSubmission.find(match).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({ success: true, data: submissions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch submissions' }, { status: 500 });
  }
}

