import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Form from '@/models/Form';
import User from '@/models/User';
import FormSubmission from '@/models/FormSubmission';
import IPAddress from '@/models/IPAddress';
import { getCurrentUser } from '@/lib/auth';

// GET dashboard statistics
export async function GET() {
  try {
    const currentUser = await getCurrentUser().catch(() => null);

    await connectDB();

    // Get counts from database - handle errors gracefully
    let totalForms = 0;
    let totalUsers = 0;
    let totalSubmissions = 0;
    let authorizedIPs = 0;
    let mySubmissions = 0;

    try {
      totalForms = await Form.countDocuments();
    } catch (err) {
      console.error('Error counting forms:', err);
    }

    try {
      totalUsers = await User.countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
    }

    try {
      totalSubmissions = await FormSubmission.countDocuments();
    } catch (err) {
      console.error('Error counting submissions:', err);
    }

    try {
      authorizedIPs = await IPAddress.countDocuments({ status: 'Active' });
    } catch (err) {
      console.error('Error counting IPs:', err);
    }

    if (currentUser?.id) {
      try {
        mySubmissions = await FormSubmission.countDocuments({ submittedBy: currentUser.id });
      } catch (err) {
        console.error('Error counting user submissions:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalForms,
        totalUsers,
        totalSubmissions,
        authorizedIPs,
        mySubmissions,
      },
    });
  } catch (error: any) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        data: {
          totalForms: 0,
          totalUsers: 0,
          totalSubmissions: 0,
          authorizedIPs: 0,
        },
      },
      { status: 500 }
    );
  }
}

