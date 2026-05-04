import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { resolveSheetsConfig } from '@/lib/googleSheets';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    env: {
      has_json_key: !!process.env.GOOGLE_SA_JSON_KEY,
      has_email: !!process.env.GOOGLE_SA_EMAIL,
      has_private_key: !!process.env.GOOGLE_SA_PRIVATE_KEY,
      has_sheet_id: !!process.env.GOOGLE_SHEETS_ID,
    },
    config: {},
    google_api_test: 'Starting...',
  };

  try {
    const config = await resolveSheetsConfig();
    diagnostics.config = config;

    if (!config.sheetId) {
      return NextResponse.json({ ...diagnostics, google_api_test: 'Error: No Sheet ID found in config' });
    }

    // Analyze ID for hidden characters
    const idAnalysis = config.sheetId.split('').map(char => ({
      char,
      code: char.charCodeAt(0),
      hex: char.charCodeAt(0).toString(16).padStart(4, '0')
    }));
    diagnostics.id_analysis = {
      length: config.sheetId.length,
      chars: idAnalysis
    };

    // Attempt to connect and just get the spreadsheet metadata
    let auth;
    let usingEmail = '';
    
    if (process.env.GOOGLE_SA_JSON_KEY) {
      const credentials = JSON.parse(process.env.GOOGLE_SA_JSON_KEY);
      usingEmail = credentials.client_email;
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else {
      usingEmail = process.env.GOOGLE_SA_EMAIL || '';
      auth = new google.auth.JWT({
        email: usingEmail,
        key: process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }

    diagnostics.using_identity = usingEmail;
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId: config.sheetId,
      });
      diagnostics.google_api_test = 'Success! Connected to: ' + response.data.properties?.title;
      diagnostics.sheet_tabs = response.data.sheets?.map(s => s.properties?.title);
    } catch (apiError: any) {
      diagnostics.google_api_test = 'Failed to fetch spreadsheet: ' + apiError.message;
      diagnostics.error_details = {
        code: apiError.code,
        status: apiError.status,
        reason: apiError.response?.data?.error?.status || 'unknown'
      };
    }

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json({
      ...diagnostics,
      google_api_test: 'Fatal Error: ' + error.message,
    });
  }
}
