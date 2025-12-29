import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import FormSubmission from '@/models/FormSubmission';
import User from '@/models/User';
import Form from '@/models/Form';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || '200'), 1000);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const match: any = { 
      submittedBy: user.id,
      deleted: { $ne: true }, // Exclude deleted submissions
    };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23, 59, 59, 999);
        match.createdAt.$lte = dt;
      }
    }

    await connectDB();

    // Get user's allowed form fields
    const dbUser = await User.findById(user.id).select('allowedFormFields');
    const allowedFields = dbUser?.allowedFormFields || [];

    const submissions = await FormSubmission.find(match)
      .populate('formId', 'fields')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Filter formData based on allowed fields if restrictions exist
    const filteredSubmissions = submissions.map((submission: any) => {
      if (allowedFields.length > 0 && submission.formData && submission.formId?.fields) {
        // Create a map of field ID to field name
        const fieldIdToName = new Map<string, string>();
        submission.formId.fields.forEach((field: any) => {
          fieldIdToName.set(field.id, field.name);
        });

        const filteredFormData: Record<string, any> = {};
        Object.keys(submission.formData).forEach(key => {
          const fieldName = fieldIdToName.get(key);
          // Check if this field name is in the allowed list
          if (fieldName && allowedFields.includes(fieldName)) {
            filteredFormData[key] = submission.formData[key];
          }
        });
        
        return {
          ...submission,
          formData: filteredFormData,
        };
      }
      return submission;
    });

    return NextResponse.json({ success: true, data: filteredSubmissions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch submissions' }, { status: 500 });
  }
}

