import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export async function GET() {
  // Defaults to use if DB is unreachable (must never crash the login page)
  let appName = process.env.APP_NAME || 'Comet';
  let appLogoUrl = process.env.APP_LOGO_URL || '/logo.svg';
  let appFaviconUrl = '';
  let showSalaryBonus = '1';

  try {
    // Attempt to load settings from DB, but don't crash if DB is slow/unavailable
    appName = (await getSetting('APP_NAME')) || appName;
    appLogoUrl = (await getSetting('APP_LOGO_URL')) || appLogoUrl;
    appFaviconUrl = (await getSetting('APP_FAVICON_URL')) || '';
    showSalaryBonus = (await getSetting('SHOW_SALARY_BONUS')) ?? '1';
  } catch (dbError: any) {
    console.error('[public-settings] DB error, using defaults:', dbError.message);
    // Fall through with defaults — login page must remain functional
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
}

