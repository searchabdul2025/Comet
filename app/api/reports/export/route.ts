import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';

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
    if (!user || !requirePermission(user.role as any, 'canManageUsers')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const format = request.nextUrl.searchParams.get('format') || 'csv';

    await connectDB();
    const submissions = await FormSubmission.find({}).sort({ createdAt: -1 }).lean();
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
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="submissions.xlsx"',
        },
      });
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30 });
      const chunks: Uint8Array[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      const done = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });

      doc.fontSize(16).text('Submissions', { underline: true });
      doc.moveDown();
      rows.forEach((r) => {
        doc.fontSize(10).text(`ID: ${r.id || ''}`);
        doc.text(`Date: ${r.createdAt || ''}`);
        doc.text(`Phone: ${r.phoneNumber || ''}`);
        doc.text(`Form ID: ${r.formId || ''}`);
        doc.text(`IP: ${r.ipAddress || ''}`);
        doc.text(`User: ${r.submittedBy || ''}`);
        doc.text(`Data: ${r.formData || ''}`);
        doc.moveDown();
      });
      doc.end();
      const pdfBuffer = await done;
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

