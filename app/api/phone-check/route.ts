import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { normalizeUsPhone, isValidUsPhone } from '@/lib/phone';

export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone') || '';
    if (!isValidUsPhone(phone)) {
      return NextResponse.json({ success: false, error: 'Invalid US phone number' }, { status: 400 });
    }

    await connectDB();
    const normalized = normalizeUsPhone(phone);
    const exists = await FormSubmission.exists({ phoneNumber: normalized });

    return NextResponse.json({ success: true, duplicate: Boolean(exists) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check phone' },
      { status: 500 }
    );
  }
}

