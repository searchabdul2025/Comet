import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Form from '@/models/Form';
import FormSubmission from '@/models/FormSubmission';
import EmployeeLead from '@/models/EmployeeLead';
import { getCurrentUser } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { normalizeUsPhone, isValidUsPhone } from '@/lib/phone';

const MAJOR_FORM_ID = 'employee-major';

const defaultFields = [
  { id: 'fullName', name: 'Full Name', type: 'text', required: true },
  { id: 'phone', name: 'Phone Number', type: 'tel', required: true },
  { id: 'meetingDate', name: 'Meeting Date', type: 'date', required: true },
  { id: 'calendly', name: 'Calendly Link (optional)', type: 'text', required: false, validation: 'Paste booked link' },
  { id: 'checkboxes', name: 'Agreements / Options', type: 'checkbox', required: false },
  { id: 'notes', name: 'Notes', type: 'textarea', required: false },
];

async function ensureMajorForm(userEmail?: string) {
  await connectDB();
  let form = await Form.findOne({ formId: MAJOR_FORM_ID });
  if (form) return form;

  // find any user as creator
  const User = (await import('@/models/User')).default;
  const creator = userEmail ? await User.findOne({ email: userEmail }) : await User.findOne({});
  form = await Form.create({
    title: 'Employee Major Form',
    formId: MAJOR_FORM_ID,
    description: 'Standard employee submission form for lead creation',
    fields: defaultFields,
    createdBy: creator?._id,
  });
  return form;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const form = await ensureMajorForm(user.email || undefined);
    const leadMode = (await getSetting('EMPLOYEE_LEAD_MODE')) || 'auto';
    const calendlyUrl = (await getSetting('EMPLOYEE_CALENDLY_URL')) || '';
    return NextResponse.json({
      success: true,
      data: {
        form,
        leadMode,
        calendlyUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load major form' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const form = await ensureMajorForm(user.email || undefined);
    const body = await request.json();
    const formData = body?.formData as Record<string, any>;
    const createLeadFlag = Boolean(body?.createLead);

    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 });
    }

    const name = (formData.fullName || formData.name || '').trim();
    const phoneRaw = (formData.phone || '').trim();
    const meetingDate = formData.meetingDate || '';

    if (!name || !phoneRaw || !meetingDate) {
      return NextResponse.json({ success: false, error: 'Name, phone, and meeting date are required.' }, { status: 400 });
    }
    if (!isValidUsPhone(phoneRaw)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number format' }, { status: 400 });
    }
    const normalizedPhone = normalizeUsPhone(phoneRaw);

    // resolve db user id
    const User = (await import('@/models/User')).default;
    const dbUser = await User.findOne({ email: user.email });
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const submission = await FormSubmission.create({
      formId: form._id,
      formData,
      submittedBy: dbUser._id,
      phoneNumber: normalizedPhone,
    });

    const leadMode = ((await getSetting('EMPLOYEE_LEAD_MODE')) as 'auto' | 'manual' | null) || 'auto';
    const shouldCreateLead = leadMode === 'auto' || createLeadFlag;

    let lead = null;
    if (shouldCreateLead) {
      lead = await EmployeeLead.create({
        employee: dbUser._id,
        customerName: name,
        phone: normalizedPhone,
        meetingDate,
        status: 'Pending',
        majorFormSubmission: submission._id,
      });
    }

    return NextResponse.json({
      success: true,
      data: { submission, leadMode, lead },
    });
  } catch (error: any) {
    console.error('Major form submit error', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit major form' },
      { status: 500 }
    );
  }
}

