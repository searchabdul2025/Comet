import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import User from '@/models/User'; // Ensure User model is registered
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser().catch(() => null);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Aggregate top agents by submission count for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          submittedBy: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$submittedBy',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 as const } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          count: 1,
          name: '$user.name',
          email: '$user.email',
        },
      },
    ];

    const topAgents = await FormSubmission.aggregate(pipeline);

    return NextResponse.json({ success: true, data: topAgents });
  } catch (error: any) {
    console.error('Top agents error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
