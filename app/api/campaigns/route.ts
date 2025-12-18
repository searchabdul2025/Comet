import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import { getCurrentUser } from '@/lib/auth';

// GET all campaigns (requires form creation permission)
export async function GET() {
  try {
    const user = await getCurrentUser();
    const { requirePermission } = await import('@/lib/permissions');
    if (!user || !requirePermission(user.role as any, 'canCreateForms', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const campaigns = await Campaign.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new campaign
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { requirePermission } = await import('@/lib/permissions');
    if (!requirePermission(user.role as any, 'canCreateForms', user.permissions)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to create campaigns' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();

    if (!body?.name) {
      return NextResponse.json(
        { success: false, error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    const User = (await import('@/models/User')).default;
    const dbUser = await User.findOne({ email: user.email });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const campaign = await Campaign.create({
      name: body.name,
      description: body.description,
      createdBy: dbUser._id,
    });

    const populated = await Campaign.findById(campaign._id).populate('createdBy', 'name email');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


