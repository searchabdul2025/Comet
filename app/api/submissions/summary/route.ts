import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canViewSubmissions', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const pipeline = [
      { $match: { createdAt: { $gte: startOfYear } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
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

