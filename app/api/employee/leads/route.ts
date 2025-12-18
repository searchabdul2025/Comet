import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmployeeLead from '@/models/EmployeeLead';
import { getCurrentUser } from '@/lib/auth';
import { normalizeUsPhone, isValidUsPhone } from '@/lib/phone';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const isSupervisor = user.role === 'Supervisor';
    const isAdmin = user.role === 'Admin';
    const match = !isSupervisor && !isAdmin ? { employee: user.id } : {};
    const leads = await EmployeeLead.find(match)
      .populate('employee', 'name email')
      .sort({ createdAt: -1 })
      .limit(500);

    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const body = await req.json();
    const customerName = (body?.customerName || '').trim();
    const phoneRaw = (body?.phone || '').trim();
    const meetingDate = body?.meetingDate || '';
    const submissionId = body?.majorFormSubmissionId;

    if (!customerName) {
      return NextResponse.json({ success: false, error: 'Customer name is required' }, { status: 400 });
    }
    if (phoneRaw && !isValidUsPhone(phoneRaw)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
    }

    const User = (await import('@/models/User')).default;
    const dbUser = await User.findOne({ email: user.email });
    const normalizedPhone = phoneRaw ? normalizeUsPhone(phoneRaw) : undefined;

    const lead = await EmployeeLead.create({
      employee: dbUser?._id,
      customerName,
      phone: normalizedPhone,
      meetingDate,
      status: 'Pending',
      majorFormSubmission: submissionId,
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create lead' }, { status: 500 });
  }
}

