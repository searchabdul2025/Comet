import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { generateExcelWorkbook } from '@/lib/excelGenerator';
import User from '@/models/User';
import Form from '@/models/Form';
export const runtime = 'nodejs';

function submissionsToRows(submissions: any[]) {
  return submissions.map((s) => ({
    id: s._id?.toString(),
    createdAt: s.createdAt,
    phoneNumber: s.phoneNumber,
    formId: s.formId?.toString(),
    ipAddress: s.ipAddress,
    submittedBy: s.submittedBy?.toString(),
    formData: JSON.stringify(s.formData || {}),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canViewSubmissions', user.permissions as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const format = request.nextUrl.searchParams.get('format') || 'csv';
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const userId = request.nextUrl.searchParams.get('userId');
    const campaignId = request.nextUrl.searchParams.get('campaignId');

    const match: any = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23, 59, 59, 999);
        match.createdAt.$lte = dt;
      }
    }

    if (userId) {
      match.submittedBy = userId;
    }

    await connectDB();

    if (campaignId) {
      const forms = await (await import('@/models/Form')).default.find({ campaign: campaignId }).select('_id').lean();
      const formIds = forms.map((f: any) => f._id);
      if (formIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      match.formId = { $in: formIds };
    }

    // Fetch submissions with populated form fields
    const submissions = await FormSubmission.find(match)
      .populate('formId', 'fields title')
      .populate('submittedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    const rows = submissionsToRows(submissions);

    if (format === 'csv') {
      const header = Object.keys(rows[0] || { id: '', createdAt: '', phoneNumber: '', formId: '', ipAddress: '', submittedBy: '', formData: '' }).join(',');
      const data = rows
        .map((r) =>
          [
            r.id,
            r.createdAt,
            r.phoneNumber,
            r.formId,
            r.ipAddress,
            r.submittedBy,
            r.formData?.replace(/"/g, '""'),
          ]
            .map((v) => `"${v ?? ''}"`)
            .join(',')
        )
        .join('\n');
      const csv = [header, data].join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="submissions.csv"',
        },
      });
    }

    if (format === 'xlsx') {
      // Extract agent names and form titles from populated submissions
      const agentNames = new Map<string, string>();
      const formTitles = new Map<string, string>();
      
      submissions.forEach((s: any) => {
        // Extract agent name
        if (s.submittedBy) {
          const agentId = typeof s.submittedBy === 'string' 
            ? s.submittedBy 
            : s.submittedBy._id?.toString() || '';
          const agentName = typeof s.submittedBy === 'object' 
            ? s.submittedBy.name || 'Unknown'
            : 'Unknown';
          if (agentId) agentNames.set(agentId, agentName);
        }

        // Extract form title
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

      // Generate enhanced Excel workbook
      const workbook = generateExcelWorkbook({
        submissions: submissions,
        agentNames,
        formTitles,
        includeSummary: true,
        sheetName: 'Submissions',
      });

      const XLSX = await import('xlsx');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      
      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="submissions_${dateStr}.xlsx"`,
        },
      });
    }

    if (format === 'pdf') {
      const { PDFDocument, StandardFonts } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      let page = doc.addPage([595, 842]); // A4
      let y = 800;
      const lineHeight = 12;
      const maxWidth = 540;

      const drawLine = (text: string, size = 10) => {
        if (y < 40) {
          page = doc.addPage([595, 842]);
          y = 800;
        }
        page.drawText(text, { x: 30, y, size, font, maxWidth });
        y -= lineHeight;
      };

      drawLine('Submissions', 14);
      drawLine('--------------------', 10);

      rows.forEach((r) => {
        drawLine(`ID: ${r.id || ''}`);
        drawLine(`Date: ${r.createdAt || ''}`);
        drawLine(`Phone: ${r.phoneNumber || ''}`);
        drawLine(`Form ID: ${r.formId || ''}`);
        drawLine(`IP: ${r.ipAddress || ''}`);
        drawLine(`User: ${r.submittedBy || ''}`);
        drawLine(`Data: ${r.formData || ''}`);
        drawLine(' ');
      });

      const pdfBytes = await doc.save();
      const pdfBuffer = Buffer.from(pdfBytes);
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="submissions.pdf"',
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported format' }, { status: 400 });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export' },
      { status: 500 }
    );
  }
}

