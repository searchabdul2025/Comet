import { google } from 'googleapis';
import { getSetting } from './settings';

type AppendRowParams = {
  sheetId: string;
  range: string; // e.g., 'Sheet1!A1'
  values: (string | number | null | undefined)[];
};

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SA_EMAIL;
  const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets credentials are missing. Set GOOGLE_SA_EMAIL and GOOGLE_SA_PRIVATE_KEY.');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function appendRow({ sheetId, range, values }: AppendRowParams) {
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values.map((v) => (v === undefined ? '' : v === null ? '' : v))],
    },
  });
}

export async function appendSubmissionRow(params: {
  sheetId: string;
  tabName?: string;
  formTitle?: string;
  formId?: string;
  submission: Record<string, any>;
  phoneNumber?: string;
  submissionId?: string; // MongoDB submission ID for deletion tracking
}) {
  const { sheetId, tabName = 'Submissions', formTitle, formId, submission, phoneNumber, submissionId } = params;
  const timestamp = new Date().toISOString();

  // Flatten submission object to key:value pairs string
  const pairs = Object.entries(submission)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v ?? ''}`)
    .join('\n');

  // Include submission ID as first column for deletion tracking
  await appendRow({
    sheetId,
    range: `${tabName}!A1`,
    values: [submissionId || '', timestamp, formTitle || '', formId || '', phoneNumber || '', pairs],
  });
}

/**
 * Delete a row from Google Sheets by submission ID
 */
export async function deleteSubmissionFromSheets(params: {
  sheetId: string;
  tabName?: string;
  submissionId: string;
}) {
  const { sheetId, tabName = 'Submissions', submissionId } = params;
  const sheets = getSheetsClient();

  try {
    // Get all values from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A:Z`,
    });

    const values = response.data.values || [];
    if (values.length === 0) {
      return { success: false, error: 'Sheet is empty' };
    }

    // Find the row index (1-based) where the first column matches submissionId
    let rowIndex = -1;
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === submissionId) {
        rowIndex = i + 1; // Google Sheets uses 1-based indexing
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Submission not found in sheet' };
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: await getSheetId(sheetId, tabName),
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-based for API
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete from Google Sheets:', error);
    return { success: false, error: error.message || 'Failed to delete from sheet' };
  }
}

/**
 * Get the sheet ID (numeric) from sheet name
 */
async function getSheetId(spreadsheetId: string, sheetName: string): Promise<number> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const sheet = response.data.sheets?.find((s) => s.properties?.title === sheetName);
  if (!sheet?.properties?.sheetId) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  return sheet.properties.sheetId;
}

export async function resolveSheetsConfig() {
  // Env takes precedence if present
  const envSheetId = process.env.GOOGLE_SHEETS_ID;
  const envSubmissionsTab = process.env.GOOGLE_SHEETS_TAB_SUBMISSIONS;
  const envDailyTab = process.env.GOOGLE_SHEETS_TAB_DAILY;

  if (envSheetId) {
    return {
      sheetId: envSheetId,
      submissionsTab: envSubmissionsTab || 'Submissions',
      dailyTab: envDailyTab || 'DailyReports',
    };
  }

  const sheetId = await getSetting('GOOGLE_SHEETS_ID');
  const submissionsTab = (await getSetting('GOOGLE_SHEETS_TAB_SUBMISSIONS')) || 'Submissions';
  const dailyTab = (await getSetting('GOOGLE_SHEETS_TAB_DAILY')) || 'DailyReports';

  return { sheetId: sheetId || '', submissionsTab, dailyTab };
}

