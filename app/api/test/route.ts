import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import User from '@/models/User';
import Form from '@/models/Form';

// Test API endpoint to verify everything is working
export async function GET() {
  try {
    // Test database connection
    await connectDB();
    
    // Test authentication
    const user = await getCurrentUser();
    
    // Test database queries
    const userCount = await User.countDocuments();
    const formCount = await Form.countDocuments();
    
    return NextResponse.json({
      success: true,
      message: 'API is working correctly!',
      data: {
        database: 'Connected ✅',
        authentication: user ? `Authenticated as ${user.email} ✅` : 'Not authenticated',
        stats: {
          users: userCount,
          forms: formCount,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'API test failed',
      },
      { status: 500 }
    );
  }
}

