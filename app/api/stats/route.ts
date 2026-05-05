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

    // Execute all counts in parallel for maximum performance
    const [
      totalFormsResult,
      totalUsersResult,
      totalSubmissionsResult,
      authorizedIPsResult,
      mySubmissionsResult
    ] = await Promise.allSettled([
      Form.countDocuments(),
      User.countDocuments(),
      FormSubmission.countDocuments(),
      IPAddress.countDocuments({ status: 'Active' }),
      currentUser?.id ? FormSubmission.countDocuments({ submittedBy: currentUser.id }) : Promise.resolve(0)
    ]);

    const totalForms = totalFormsResult.status === 'fulfilled' ? totalFormsResult.value : 0;
    const totalUsers = totalUsersResult.status === 'fulfilled' ? totalUsersResult.value : 0;
    const totalSubmissions = totalSubmissionsResult.status === 'fulfilled' ? totalSubmissionsResult.value : 0;
    const authorizedIPs = authorizedIPsResult.status === 'fulfilled' ? authorizedIPsResult.value : 0;
    const mySubmissions = mySubmissionsResult.status === 'fulfilled' ? mySubmissionsResult.value : 0;

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

