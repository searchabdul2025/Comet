import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Form from '@/models/Form';
import Campaign from '@/models/Campaign';
import { getCurrentUser } from '@/lib/auth';

// GET single form by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    // Handle both async and sync params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const formId = resolvedParams.id;
    
    // Validate ObjectId format
    if (!formId || formId.length !== 24) {
      return NextResponse.json(
        { success: false, error: 'Invalid form ID format' },
        { status: 400 }
      );
    }
    
    const form = await Form.findById(formId)
      .populate('createdBy', 'name email')
      .populate('campaign', 'name description');
    
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: form });
  } catch (error: any) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch form',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT update form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user can edit forms (Admin or Supervisor)
    const { requirePermission } = await import('@/lib/permissions');
    if (!requirePermission(user.role as any, 'canEditForms')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to edit forms' },
        { status: 403 }
      );
    }

    // Handle both async and sync params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const formId = resolvedParams.id;

    await connectDB();
    const body = await request.json();

    if (body?.campaign) {
      const campaign = await Campaign.findById(body.campaign);
      if (!campaign) {
        return NextResponse.json(
          { success: false, error: 'Campaign not found' },
          { status: 404 }
        );
      }
    }
    
    const form = await Form.findByIdAndUpdate(
      formId,
      body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: form });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Admin can delete forms
    const { requirePermission } = await import('@/lib/permissions');
    if (!requirePermission(user.role as any, 'canDeleteForms')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Admin can delete forms' },
        { status: 403 }
      );
    }

    // Handle both async and sync params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const formId = resolvedParams.id;

    await connectDB();
    const form = await Form.findByIdAndDelete(formId);
    
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Form deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

