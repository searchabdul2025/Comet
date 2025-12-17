import { google } from 'googleapis';

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
}) {
  const { sheetId, tabName = 'Submissions', formTitle, formId, submission, phoneNumber } = params;
  const timestamp = new Date().toISOString();

  // Flatten submission object to key:value pairs string
  const pairs = Object.entries(submission)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v ?? ''}`)
    .join('\n');

  await appendRow({
    sheetId,
    range: `${tabName}!A1`,
    values: [timestamp, formTitle || '', formId || '', phoneNumber || '', pairs],
  });
}

