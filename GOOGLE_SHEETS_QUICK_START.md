# Google Sheets Integration - Quick Start Guide

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Google Cloud Project & Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Sheets API**:
   - Go to **APIs & Services** → **Library**
   - Search "Google Sheets API" → Click **Enable**

4. Create Service Account:
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **Service account**
   - Name it (e.g., `comet-portal-sheets`)
   - Click **Create and Continue** → **Done**

5. Create & Download Key:
   - Click on your service account email
   - Go to **Keys** tab → **Add Key** → **Create new key**
   - Select **JSON** → **Create**
   - **SAVE THE DOWNLOADED JSON FILE** (you'll need it next)

### Step 2: Extract Credentials from JSON

Open the downloaded JSON file. You need two values:

```json
{
  "client_email": "comet-portal-sheets@your-project.iam.gserviceaccount.com",  ← This is GOOGLE_SA_EMAIL
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"  ← This is GOOGLE_SA_PRIVATE_KEY
}
```

### Step 3: Create Google Sheet & Share

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. **Get Sheet ID from URL**:
   - URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - Sheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` (between `/d/` and `/edit`)

4. **Share with Service Account**:
   - Click **Share** button (top right)
   - Paste the `client_email` from Step 2
   - Give it **Editor** permissions
   - Click **Send**

5. **Create Tabs** (optional but recommended):
   - Create tab named: `Submissions`
   - Create tab named: `DailyReports`

### Step 4: Set Environment Variables

#### For Local Development (.env.local):

Create or edit `.env.local` in your project root:

```env
# Google Sheets Service Account (REQUIRED)
GOOGLE_SA_EMAIL=comet-portal-sheets@your-project.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Google Sheets Configuration (REQUIRED)
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SHEETS_TAB_SUBMISSIONS=Submissions
GOOGLE_SHEETS_TAB_DAILY=DailyReports
```

**⚠️ Important Notes:**
- Wrap `GOOGLE_SA_PRIVATE_KEY` in quotes
- Keep the `\n` characters in the private key
- Include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

#### For Vercel (Production):

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add each variable:
   - `GOOGLE_SA_EMAIL` = your service account email
   - `GOOGLE_SA_PRIVATE_KEY` = your private key (with quotes)
   - `GOOGLE_SHEETS_ID` = your sheet ID
   - `GOOGLE_SHEETS_TAB_SUBMISSIONS` = `Submissions`
   - `GOOGLE_SHEETS_TAB_DAILY` = `DailyReports`
3. Select **Production, Preview, Development** for each
4. **Redeploy** your application

### Step 5: Test the Integration

1. **Test Form Submission**:
   - Submit a form through your application
   - Check your Google Sheet → `Submissions` tab
   - You should see a new row with the submission data

2. **Test Manual Export**:
   - Go to **Dashboard** → **Reports**
   - Click **"Export to Google Sheets"**
   - Check your Google Sheet for the exported data

## ✅ What's Already Implemented

Your application already has Google Sheets integration built-in:

- ✅ **Automatic Export**: Form submissions are automatically sent to Google Sheets
- ✅ **Manual Export**: Export filtered submissions from Reports page
- ✅ **Daily Reports**: Automatic daily report generation
- ✅ **Delete Support**: Can delete submissions from Google Sheets
- ✅ **Configurable**: Can set sheet ID and tab names via Settings page or env vars

## 📋 Integration Points in Code

1. **`lib/googleSheets.ts`** - Core Google Sheets functions
2. **`app/api/forms/[id]/submit/route.ts`** - Auto-export on form submission
3. **`app/api/reports/export/sheets/route.ts`** - Manual export functionality
4. **`app/api/reports/daily/route.ts`** - Daily reports export
5. **`app/api/submissions/[id]/route.ts`** - Delete from sheets

## 🔧 Configuration Options

You can configure Google Sheets in two ways:

### Option 1: Environment Variables (Recommended)
Set `GOOGLE_SHEETS_ID`, `GOOGLE_SHEETS_TAB_SUBMISSIONS`, `GOOGLE_SHEETS_TAB_DAILY` in `.env.local` or Vercel

### Option 2: Settings Page
Go to **Settings** page in your app and configure:
- Google Sheets ID
- Submissions Tab Name
- Daily Reports Tab Name

**Note**: Service account credentials (`GOOGLE_SA_EMAIL` and `GOOGLE_SA_PRIVATE_KEY`) must always be set via environment variables for security.

## 🐛 Troubleshooting

### Error: "Google Sheets credentials are missing"
- **Fix**: Make sure `GOOGLE_SA_EMAIL` and `GOOGLE_SA_PRIVATE_KEY` are set in environment variables

### Error: "The caller does not have permission"
- **Fix**: Share your Google Sheet with the service account email and give it **Editor** permissions

### Error: "Requested entity was not found"
- **Fix**: Verify `GOOGLE_SHEETS_ID` is correct and the sheet exists

### Data Not Appearing
- Check browser console for errors
- Verify tab names match exactly (case-sensitive)
- Ensure service account has Editor permissions
- Check that sheet ID is correct

## 📚 Full Documentation

For detailed setup instructions, troubleshooting, and advanced configuration, see:
- **`GOOGLE_SHEETS_SETUP.md`** - Complete setup guide with screenshots and troubleshooting

## 🔒 Security Best Practices

1. ✅ Never commit service account credentials to Git
2. ✅ Use environment variables for all sensitive data
3. ✅ Limit service account permissions to specific sheets only
4. ✅ Use different service accounts for dev/production
5. ✅ Rotate keys periodically if compromised

## 📊 Sheet Structure

### Submissions Tab Format:
| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Submission ID | Timestamp | Form Title | Form ID | Phone Number | Form Data (key:value pairs) |

### Daily Reports Tab Format:
| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| Date | Total Submissions | Unique Phones | Form Count | Form Breakdown |

---

**Need Help?** Check `GOOGLE_SHEETS_SETUP.md` for detailed troubleshooting and advanced setup options.



