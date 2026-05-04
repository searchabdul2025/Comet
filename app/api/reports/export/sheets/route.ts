import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { appendRow, resolveSheetsConfig } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canViewSubmissions', user.permissions as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { sheetId, submissionsTab } = await resolveSheetsConfig();
    if (!sheetId) {
      return NextResponse.json({ success: false, error: 'Sheets not configured' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const userId = searchParams.get('userId');
    const campaignId = searchParams.get('campaignId');

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
        return NextResponse.json({ success: true, count: 0 });
      }
      match.formId = { $in: formIds };
    }

    const submissions = await FormSubmission.find(match).sort({ createdAt: -1 }).lean();

    for (const s of submissions) {
      const pairs = Object.entries(s.formData || {})
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v ?? ''}`)
        .join('\n');
      await appendRow({
        sheetId,
        range: `${submissionsTab}!A1`,
        values: [
          s.createdAt?.toISOString?.() || '',
          s.formId?.toString() || '',
          s.phoneNumber || '',
          s.ipAddress || '',
          s.submittedBy?.toString() || '',
          pairs,
        ],
      });
    }

    return NextResponse.json({ success: true, count: submissions.length });
  } catch (error: any) {
    console.error('Sheets export failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export to Sheets' },
      { status: 500 }
    );
  }
}

