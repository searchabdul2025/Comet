import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import FormSubmission from '@/models/FormSubmission';
import Form from '@/models/Form';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser().catch(() => null);
    if (!currentUser) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch recent submissions
    const recentSubmissions = await FormSubmission.find({ deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('formId', 'title')
      .populate('submittedBy', 'name');

    // Fetch recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch recent forms
    const recentForms = await Form.find()
      .sort({ createdAt: -1 })
      .limit(3);

    const activities: any[] = [];

    // Map submissions to activity format
    recentSubmissions.forEach((sub) => {
      activities.push({
        id: sub._id,
        label: `New submission for ${sub.formId?.title || 'Unknown Form'}`,
        time: sub.createdAt,
        icon: '📝',
        link: '/dashboard/reports',
        type: 'submission'
      });
    });

    // Map users to activity format
    recentUsers.forEach((user) => {
      activities.push({
        id: user._id,
        label: `New user registered: ${user.name}`,
        time: user.createdAt,
        icon: '👤',
        link: '/user-management',
        type: 'user'
      });
    });

    // Sort combined activities by time
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      success: true,
      data: activities.slice(0, 8), // Return top 8 recent activities
    });
  } catch (error: any) {
    console.error('Activity API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
