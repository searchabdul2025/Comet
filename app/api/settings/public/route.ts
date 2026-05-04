import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export async function GET() {
  try {
    const appName = (await getSetting('APP_NAME')) || process.env.APP_NAME || 'Portal';
    const appLogoUrl = (await getSetting('APP_LOGO_URL')) || process.env.APP_LOGO_URL || '';
    const showSalaryBonus = (await getSetting('SHOW_SALARY_BONUS')) ?? '1';

    return NextResponse.json({
      success: true,
      data: {
        APP_NAME: appName,
        APP_LOGO_URL: appLogoUrl,
        SHOW_SALARY_BONUS: showSalaryBonus,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load branding' },
      { status: 500 }
    );
  }
}

