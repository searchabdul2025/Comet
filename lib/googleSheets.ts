import { google } from 'googleapis';
import { getSetting } from './settings';

type AppendRowParams = {
  sheetId: string;
  range: string; // e.g., 'Sheet1!A1'
  values: (string | number | null | undefined)[];
};

function getSheetsClient() {
  // 1. Try the full JSON key first (most reliable)
  if (process.env.GOOGLE_SA_JSON_KEY) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SA_JSON_KEY);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      return google.sheets({ version: 'v4', auth });
    } catch (err) {
      console.error('Failed to parse GOOGLE_SA_JSON_KEY:', err);
    }
  }

  // 2. Fallback to individual variables
  const clientEmail = process.env.GOOGLE_SA_EMAIL;
  const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets credentials are missing. Set GOOGLE_SA_JSON_KEY or both GOOGLE_SA_EMAIL and GOOGLE_SA_PRIVATE_KEY.');
  }

  const cleanKey = privateKey
    .split(String.raw`\n`)
    .join('\n')
    .replace(/^"|"$/g, '')
    .trim();

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: cleanKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function appendRow({ sheetId, range, values }: AppendRowParams) {
  const sheets = getSheetsClient();
  const tabName = range.includes('!') ? range.split('!')[0] : 'Submissions';

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values.map((v) => (v === undefined ? '' : v === null ? '' : v))],
      },
    });
  } catch (error: any) {
    // If the tab doesn't exist, create it and try again
    if (error.message.includes('not found') || error.code === 400) {
      try {
        await createSheet(sheetId, tabName);
        // Default headers for basic append
        const headers = ['ID', 'Timestamp', 'Form Title', 'Form ID', 'Phone Number', 'Submission Data'];
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${tabName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [headers] },
        });
        
        await formatHeaders(sheetId, tabName);

        // Try appending again
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [values.map((v) => (v === undefined ? '' : v === null ? '' : v))],
          },
        });
      } catch (innerError) {
        console.error('Failed to create sheet or append after creation:', innerError);
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Advanced append that maps fields to specific columns dynamically
 */
export async function appendDynamicRow(params: {
  sheetId: string;
  tabName: string;
  fixedData: (string | number | null | undefined)[];
  dynamicData: Record<string, any>;
  fixedHeaders: string[];
}) {
  const { sheetId, tabName, fixedData, dynamicData, fixedHeaders } = params;
  const sheets = getSheetsClient();

  // 1. Get existing headers or create sheet if missing
  let headers: string[] = [];
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!1:1`,
    });
    headers = response.data.values?.[0] || [];
  } catch (error: any) {
    if (error.code === 404 || error.message.includes('not found')) {
      await createSheet(sheetId, tabName);
      headers = [];
    } else {
      throw error;
    }
  }

  // 2. If no headers, initialize with fixed headers
  if (headers.length === 0) {
    headers = [...fixedHeaders];
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
    await formatHeaders(sheetId, tabName);
  }

  // 3. Check for new dynamic fields and add columns if needed
  const dynamicKeys = Object.keys(dynamicData);
  let headersUpdated = false;
  for (const key of dynamicKeys) {
    if (!headers.includes(key)) {
      headers.push(key);
      headersUpdated = true;
    }
  }

  if (headersUpdated) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
  }

  // 4. Map data to header positions
  const row = headers.map((header, index) => {
    if (index < fixedHeaders.length) {
      return fixedData[index] ?? '';
    }
    return dynamicData[header] ?? '';
  });

  // 5. Append the row
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  });
}

/**
 * Format headers (Bold and Freeze)
 */
async function formatHeaders(spreadsheetId: string, tabName: string) {
  const sheets = getSheetsClient();
  
  // Get sheet ID from name
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === tabName);
  const sheetInternalId = sheet?.properties?.sheetId;

  if (sheetInternalId === undefined) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: sheetInternalId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        },
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetInternalId,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: 'gridProperties.frozenRowCount',
          },
        },
      ],
    },
  });
}

/**
 * Create a new tab in the spreadsheet
 */
async function createSheet(spreadsheetId: string, title: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title,
            },
          },
        },
      ],
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

  await appendDynamicRow({
    sheetId,
    tabName,
    fixedHeaders: ['Submission ID', 'Timestamp', 'Form Title', 'Form ID', 'Phone Number'],
    fixedData: [submissionId, timestamp, formTitle, formId, phoneNumber],
    dynamicData: submission,
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
  const envSheetId = process.env.GOOGLE_SHEETS_ID?.trim();
  const envSubmissionsTab = process.env.GOOGLE_SHEETS_TAB_SUBMISSIONS?.trim();
  const envDailyTab = process.env.GOOGLE_SHEETS_TAB_DAILY?.trim();
  const envDuplicatesTab = process.env.GOOGLE_SHEETS_TAB_DUPLICATES?.trim();

  if (envSheetId) {
    return {
      sheetId: envSheetId,
      submissionsTab: envSubmissionsTab || 'Submissions',
      dailyTab: envDailyTab || 'DailyReports',
      duplicatesTab: envDuplicatesTab || 'Duplicates',
    };
  }

  const sheetId = (await getSetting('GOOGLE_SHEETS_ID'))?.trim();
  const submissionsTab = ((await getSetting('GOOGLE_SHEETS_TAB_SUBMISSIONS')) || 'Submissions').trim();
  const dailyTab = ((await getSetting('GOOGLE_SHEETS_TAB_DAILY')) || 'DailyReports').trim();
  const duplicatesTab = ((await getSetting('GOOGLE_SHEETS_TAB_DUPLICATES')) || 'Duplicates').trim();

  return { sheetId: sheetId || '', submissionsTab, dailyTab, duplicatesTab };
}

