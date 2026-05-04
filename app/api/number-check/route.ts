import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';

export async function GET(request: NextRequest) {
  try {
    const formId = request.nextUrl.searchParams.get('formId');
    const fieldId = request.nextUrl.searchParams.get('fieldId');
    const value = request.nextUrl.searchParams.get('value');

    if (!formId || !fieldId || !value) {
      return NextResponse.json(
        { success: false, error: 'formId, fieldId, and value are required' },
        { status: 400 }
      );
    }

    if (!value.trim()) {
      return NextResponse.json({ success: true, duplicate: false });
    }

    await connectDB();

    // Check if any submission has the same value in formData for this field
    // Also exclude soft-deleted submissions
    const exists = await FormSubmission.exists({
      formId,
      deleted: { $ne: true },
      [`formData.${fieldId}`]: value.trim(),
    });

    return NextResponse.json({ success: true, duplicate: Boolean(exists) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check number' },
      { status: 500 }
    );
  }
}

