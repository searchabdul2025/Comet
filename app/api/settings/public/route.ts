import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export async function GET() {
  try {
    let appName = process.env.APP_NAME || 'Portal';
    let appLogoUrl = process.env.APP_LOGO_URL || '';
    let appFaviconUrl = '';
    let showSalaryBonus = '1';

    try {
      appName = (await getSetting('APP_NAME')) || appName;
      appLogoUrl = (await getSetting('APP_LOGO_URL')) || appLogoUrl;
      appFaviconUrl = (await getSetting('APP_FAVICON_URL')) || '';
      showSalaryBonus = (await getSetting('SHOW_SALARY_BONUS')) ?? '1';
    } catch (dbError) {
      console.error('Database error in public settings:', dbError);
      // Continue with defaults
    }

    return NextResponse.json({
      success: true,
      data: {
        APP_NAME: appName,
        APP_LOGO_URL: appLogoUrl,
        APP_FAVICON_URL: appFaviconUrl,
        SHOW_SALARY_BONUS: showSalaryBonus,
      },
    });
  } catch (error: any) {
    console.error('Critical error in public settings:', error);
    return NextResponse.json(
      { success: true, data: { APP_NAME: 'Portal', APP_LOGO_URL: '', APP_FAVICON_URL: '', SHOW_SALARY_BONUS: '1' } },
      { status: 200 } // Return 200 with defaults to avoid UI break
    );
  }
}

