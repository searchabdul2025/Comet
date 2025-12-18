import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { getSetting, setSettings } from '@/lib/settings';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageSettings', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const keys = [
      'GOOGLE_SHEETS_ID',
      'GOOGLE_SHEETS_TAB_SUBMISSIONS',
      'GOOGLE_SHEETS_TAB_DAILY',
      'APP_NAME',
      'APP_LOGO_URL',
      'EMPLOYEE_LEAD_MODE', // auto | manual
      'EMPLOYEE_CALENDLY_URL',
      'CHAT_RATE_LIMIT_PER_MINUTE',
      'CHAT_MESSAGE_MAX_LENGTH',
      'CHAT_HISTORY_LIMIT',
    ];
    const entries = await Promise.all(keys.map(async (key) => [key, await getSetting(key)] as const));
    const data: Record<string, string | null> = {};
    entries.forEach(([k, v]) => (data[k] = v));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageSettings', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const settings = body?.settings as Record<string, string | undefined>;
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    // Filter out undefined values
    const cleaned: Record<string, string> = {};
    Object.entries(settings).forEach(([k, v]) => {
      if (typeof v === 'string') cleaned[k] = v;
    });

    await setSettings(cleaned);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

