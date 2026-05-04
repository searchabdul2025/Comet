import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser().catch(() => null);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const submissions = await FormSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('submittedBy', 'name email')
      .populate('formId', 'title')
      .lean();

    const data = submissions.map((s: any) => {
      const now = new Date();
      const created = new Date(s.createdAt);
      const diffMs = now.getTime() - created.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo = 'just now';
      if (diffDays > 0) timeAgo = `${diffDays}d ago`;
      else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
      else if (diffMins > 0) timeAgo = `${diffMins}m ago`;

      return {
        _id: s._id?.toString(),
        agentName: s.submittedBy?.name || s.submittedBy?.email || 'Unknown',
        formTitle: s.formId?.title || 'Unknown Form',
        timeAgo,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Recent submissions error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
