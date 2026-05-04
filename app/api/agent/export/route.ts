import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { generateExcelWorkbook } from '@/lib/excelGenerator';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const format = request.nextUrl.searchParams.get('format') || 'xlsx';
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');

    const match: any = {
      submittedBy: user.id // MUST be strictly the logged-in user
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

    // Fetch submissions with populated form fields
    const submissions = await FormSubmission.find(match)
      .populate('formId', 'fields title')
      .sort({ createdAt: -1 })
      .lean();
    
    if (format === 'xlsx') {
      const formTitles = new Map<string, string>();
      
      submissions.forEach((s: any) => {
        if (s.formId) {
          const formId = typeof s.formId === 'string' 
            ? s.formId 
            : s.formId._id?.toString() || '';
          const formTitle = typeof s.formId === 'object' 
            ? s.formId.title || 'Unknown Form'
            : 'Unknown Form';
          if (formId) formTitles.set(formId, formTitle);
        }
      });

      const workbook = generateExcelWorkbook({
        submissions: submissions,
        formTitles,
        includeSummary: true,
        sheetName: 'My Submissions',
        separateSheetsByAgent: false
      });

      const XLSX = await import('xlsx');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      
      const dateStr = new Date().toISOString().split('T')[0];
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="my_submissions_${dateStr}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported format' }, { status: 400 });
  } catch (error: any) {
    console.error('Agent export error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export' },
      { status: 500 }
    );
  }
}
