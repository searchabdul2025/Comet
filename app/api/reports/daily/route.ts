import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import Form from '@/models/Form';
import { appendRow } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    if (!sheetId) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_SHEETS_ID is not configured' },
        { status: 400 }
      );
    }

    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 1);

    const submissions = await FormSubmission.find({
      createdAt: { $gte: start, $lt: end },
    }).lean();

    const formIds = Array.from(new Set(submissions.map((s) => s.formId?.toString()).filter(Boolean)));
    const forms = await Form.find({ _id: { $in: formIds } }).lean();
    const formTitleMap = new Map(forms.map((f: any) => [f._id.toString(), f.title]));

    const total = submissions.length;
    const uniquePhones = Array.from(new Set(submissions.map((s) => s.phoneNumber).filter(Boolean))).length;

    await appendRow({
      sheetId,
      range: 'DailyReports!A1',
      values: [
        start.toISOString().slice(0, 10),
        total,
        uniquePhones,
        formIds.length,
        formIds
          .map((id) => `${formTitleMap.get(id) || id}: ${submissions.filter((s) => s.formId?.toString() === id).length}`)
          .join('\n'),
      ],
    });

    return NextResponse.json({
      success: true,
      data: { date: start.toISOString().slice(0, 10), total, uniquePhones },
    });
  } catch (error: any) {
    console.error('Daily report error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create daily report' },
      { status: 500 }
    );
  }
}

