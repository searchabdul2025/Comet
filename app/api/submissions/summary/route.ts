import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import type { PipelineStage } from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canViewSubmissions', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let startOfYear: Date | undefined = undefined;
    const match: Record<string, any> = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23, 59, 59, 999);
        match.createdAt.$lte = dt;
      }
    } else {
      startOfYear = new Date(new Date().getFullYear(), 0, 1);
      match.createdAt = { $gte: startOfYear };
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1 as 1, '_id.month': 1 as 1 } },
    ];

    const data = await FormSubmission.aggregate(pipeline);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const summary = months.map((m) => {
      const row = data.find((d) => d._id.month === m);
      return { month: m, count: row?.count ?? 0 };
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load summary' },
      { status: 500 }
    );
  }
}

