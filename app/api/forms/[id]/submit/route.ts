import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Form from '@/models/Form';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { normalizeUsPhone, isValidUsPhone } from '@/lib/phone';
import { appendSubmissionRow, resolveSheetsConfig } from '@/lib/googleSheets';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return params instanceof Promise ? await params : params;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    const { id } = await resolveParams(params);
    const body = await request.json();

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    }

    const user = await getCurrentUser().catch(() => null);
    let dbUserId: string | undefined;
    let agentName: string | undefined;
    if (user?.email) {
      const User = (await import('@/models/User')).default;
      const dbUser = await User.findOne({ email: user.email });
      dbUserId = dbUser?._id;
      agentName = dbUser?.name;
    }

    const rawPhone: string | undefined = body.phoneNumber;
    const normalizedPhone = rawPhone ? normalizeUsPhone(rawPhone) : undefined;

    if (rawPhone && !isValidUsPhone(rawPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid US phone number format' },
        { status: 400 }
      );
    }

    if (normalizedPhone) {
      const existing = await FormSubmission.findOne({ phoneNumber: normalizedPhone });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Phone already exists', duplicate: true },
          { status: 409 }
        );
      }
    }

    const submission = await FormSubmission.create({
      formId: form._id,
      formData: body.formData || {},
      submittedBy: dbUserId,
      ipAddress: body.ipAddress,
      phoneNumber: normalizedPhone,
      productGrade: body.productGrade || undefined, // Product grade for bonus calculation
    });

    // Fire-and-forget Google Sheets append (do not block response)
    (async () => {
      try {
        const { sheetId: globalSheetId, submissionsTab: globalSubmissionsTab } = await resolveSheetsConfig();
        
        // Fetch campaign to check for per-campaign sheet settings
        const Campaign = (await import('@/models/Campaign')).default;
        const campaign = form.campaign ? await Campaign.findById(form.campaign) : null;
        
        const campaignSheetId = campaign?.googleSheetId;
        const campaignTabs = campaign?.sheetTabs || [];
        
        // 1. Sync to Global Sheet
        if (globalSheetId) {
          const targetTab = agentName ? agentName.replace(/[^\w\s]/gi, '').trim() : globalSubmissionsTab;
          await appendSubmissionRow({
            sheetId: globalSheetId,
            tabName: targetTab,
            formTitle: form.title,
            formId: form.formId,
            submission: body.formData || {},
            phoneNumber: normalizedPhone,
            submissionId: submission._id.toString(),
          });
        }

        // 2. Sync to Campaign Sheet (if configured)
        if (campaignSheetId && campaignSheetId !== globalSheetId) {
          // Find tab for submissions or fallback to default
          const subTab = campaignTabs.find((t: any) => t.purpose === 'submissions');
          const campaignTabName = subTab?.name || 'Submissions';

          await appendSubmissionRow({
            sheetId: campaignSheetId,
            tabName: campaignTabName,
            formTitle: form.title,
            formId: form.formId,
            submission: body.formData || {},
            phoneNumber: normalizedPhone,
            submissionId: submission._id.toString(),
          });
        }
      } catch (err) {
        console.error('Sheets sync failed', err);
      }
    })();

    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit form' },
      { status: 500 }
    );
  }
}

