import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import FormSubmission from '@/models/FormSubmission';
import User from '@/models/User';
import Form from '@/models/Form';
import { filterAgentVisibleData } from '@/lib/agentDataFilter';

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

    // Get user's role to determine data visibility
    const dbUser = await User.findById(user.id).select('role allowedFormFields').lean() as any;
    const isAgent = dbUser?.role === 'User';

    const submissions = await FormSubmission.find(match)
      .populate('formId', 'fields title')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Filter data based on user role - agents can only see customer names
    const filteredSubmissions = submissions.map((submission: any) => {
      // For agents, only show customer name field
      if (isAgent && submission.formData && submission.formId?.fields) {
        const { customerName, customerNameField } = filterAgentVisibleData(
          submission.formData,
          submission.formId.fields
        );

        // Return only customer name in formData, hide all other fields
        const restrictedFormData: Record<string, any> = {};
        if (customerNameField && customerName) {
          restrictedFormData[customerNameField] = customerName;
        }

        return {
          ...submission,
          formData: restrictedFormData,
          customerName: customerName, // Add as separate field for easier access
          // Hide phone number from agents
          phoneNumber: undefined,
        };
      }

      // For admin/supervisor, check allowedFormFields if restrictions exist
      if (!isAgent && submission.formData && submission.formId?.fields) {
        const allowedFields = dbUser?.allowedFormFields || [];
        if (allowedFields.length > 0) {
          const fieldIdToName = new Map<string, string>();
          submission.formId.fields.forEach((field: any) => {
            fieldIdToName.set(field.id, field.name);
          });

          const filteredFormData: Record<string, any> = {};
          Object.keys(submission.formData).forEach(key => {
            const fieldName = fieldIdToName.get(key);
            if (fieldName && allowedFields.includes(fieldName)) {
              filteredFormData[key] = submission.formData[key];
            }
          });
          
          return {
            ...submission,
            formData: filteredFormData,
          };
        }
      }

      // For admin/supervisor with no restrictions, return all data
      return submission;
    });

    return NextResponse.json({ success: true, data: filteredSubmissions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch submissions' }, { status: 500 });
  }
}

