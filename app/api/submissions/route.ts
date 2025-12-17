import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageUsers')) {
      // canManageUsers is admin-only in current permissions
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || '500'), 2000);

    const submissions = await FormSubmission.find({})
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

