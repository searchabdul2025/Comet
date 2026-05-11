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

    // Log to Google Sheets if it's a duplicate
    if (exists) {
      const { appendSubmissionRow, resolveSheetsConfig } = await import('@/lib/googleSheets');
      const Form = (await import('@/models/Form')).default;
      const form = await Form.findById(formId);
      
      const { sheetId, duplicatesTab } = await resolveSheetsConfig();
      if (sheetId) {
        // Fire and forget
        appendSubmissionRow({
          sheetId,
          tabName: duplicatesTab,
          formTitle: form?.title || 'Duplicate Check',
          formId: form?.formId,
          submission: { 
            field: fieldId,
            duplicateValue: value.trim(),
            reason: 'Duplicate number attempt',
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
          }
        }).catch(err => console.error('Failed to log duplicate to sheets:', err));
      }
    }

    return NextResponse.json({ success: true, duplicate: Boolean(exists) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check number' },
      { status: 500 }
    );
  }
}

