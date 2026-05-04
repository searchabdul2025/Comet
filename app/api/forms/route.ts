import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Form from '@/models/Form';
import Campaign from '@/models/Campaign';
import { getCurrentUser } from '@/lib/auth';

// GET all forms
export async function GET() {
  try {
    await connectDB();
    const forms = await Form.find()
      .populate('createdBy', 'name email')
      .populate('campaign', 'name description')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: forms });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new form
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user can create forms (Admin or Supervisor)
    const { requirePermission } = await import('@/lib/permissions');
    if (!requirePermission(user.role as any, 'canCreateForms')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to create forms' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();

    if (!body?.campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign is required for creating a form' },
        { status: 400 }
      );
    }

    const campaign = await Campaign.findById(body.campaign);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Get user from database to get the ObjectId
    const User = (await import('@/models/User')).default;
    const dbUser = await User.findOne({ email: user.email });
    
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const form = await Form.create({
      ...body,
      createdBy: dbUser._id,
    });
    
    const populatedForm = await Form.findById(form._id).populate('createdBy', 'name email');
    
    return NextResponse.json({ success: true, data: populatedForm }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

