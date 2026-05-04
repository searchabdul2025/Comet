# Google Sheets Integration Setup Guide

This guide will walk you through setting up Google Sheets integration for your Comet Portal application.

## Overview

The application can automatically export form submissions and daily reports to Google Sheets. This requires:

1. **Google Service Account** - A service account with Google Sheets API access
2. **Google Sheet** - A spreadsheet where data will be exported
3. **Environment Variables** - Service account credentials and sheet configuration

---

## Step 1: Create a Google Cloud Project
https://console.cloud.google.com
1. Go to [Google Cloud Console](/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Comet Portal Sheets")
5. Click **"Create"**
6. Wait for the project to be created, then select it

---

## Step 2: Enable Google Sheets API

1. In your Google Cloud project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"**
3. Click on it and press **"Enable"**
4. Wait for the API to be enabled

---

## Step 3: Create a Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"Service account"**
4. Fill in the details:
   - **Service account name**: `comet-portal-sheets` (or any name you prefer)
   - **Service account ID**: Will auto-generate
   - **Description**: (Optional) "Service account for Comet Portal Google Sheets integration"
5. Click **"Create and Continue"**
6. Skip the optional steps (Grant access, Grant users access) and click **"Done"**

---

## Step 4: Create and Download Service Account Key

1. In the **"Credentials"** page, find your newly created service account
2. Click on the service account email
3. Go to the **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. A JSON file will download automatically - **SAVE THIS FILE SECURELY** (you'll need it in the next step)

**⚠️ Important**: This JSON file contains sensitive credentials. Never commit it to version control!

### ⚠️ If Key Creation is Blocked (Organization Policy)

If you see an error message saying **"Service account key creation is disabled"** due to an organization policy:

**Option 1: Override Policy for Your Project (If You Have Permissions)**

If you have the **Organization Policy Administrator** role (`roles/orgpolicy.policyAdmin`), you can override this policy:

1. Go to **IAM & Admin** → **Organization Policies** in Google Cloud Console
2. Search for or find the constraint: `iam.disableServiceAccountKeyCreation`
3. Click on the constraint name
4. You'll see "Policy for 'Disable service account key creation'"
5. Click **"Manage policy"** button (pencil icon)
6. Select your project from the dropdown (e.g., "My First Project")
7. Choose one of these options:
   - **"Not enforced"** - Completely disable the policy for this project
   - **"Custom"** - Set custom rules (if you need more granular control)
8. Click **"Save"**
9. Wait a few minutes for the policy change to propagate
10. Try creating the service account key again

**Note**: If you don't have the required permissions, you'll see a message about needing `orgpolicy.policyAdmin` role. In that case, contact your organization administrator.

**Option 1B: Request Policy Exception (If You Don't Have Permissions)**
1. Contact your **Organization Policy Administrator** (someone with `roles/orgpolicy.policyAdmin` role)
2. Share with them:
   - Your project name: "My First Project" (or your project ID)
   - The constraint ID: `iam.disableServiceAccountKeyCreation`
   - Request: Override the policy to "Not enforced" for your specific project
3. They can follow the steps above to override it for your project

**Option 2: Use Workload Identity Federation (Advanced)**
- This is a more secure alternative that doesn't require service account keys
- Requires additional setup with your hosting provider (e.g., Vercel)
- See [Google's Workload Identity Federation documentation](https://cloud.google.com/iam/docs/workload-identity-federation)

**Option 3: Use OAuth 2.0 (Alternative Approach)**
- Instead of service account keys, you can use OAuth 2.0 user credentials
- This requires user authentication flow, which may not be suitable for automated exports
- Less secure for server-side applications

**Note**: For most individual projects (not part of an organization), this policy should not be enforced. If you're using a personal Google account and still see this error, try creating a new project or contact Google Cloud support.

---

## Step 5: Extract Credentials from JSON

Open the downloaded JSON file. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "comet-portal-sheets@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

You need to extract:
- **`client_email`** - This is your `GOOGLE_SA_EMAIL`
- **`private_key`** - This is your `GOOGLE_SA_PRIVATE_KEY`

---

## Step 6: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet or use an existing one
3. **Get the Sheet ID from the URL**:
   - The URL will look like: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - The Sheet ID is the long string between `/d/` and `/edit`: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
4. **Share the sheet with your service account**:
   - Click the **"Share"** button (top right)
   - Paste your service account email (the `client_email` from Step 5)
   - Give it **"Editor"** permissions
   - Click **"Send"** (you can uncheck "Notify people" if you want)

---

## Step 7: Set Up Environment Variables

### Option A: Using `.env.local` (Local Development)

1. Open or create `.env.local` in your project root
2. Add the following variables:

```env
# Google Sheets Service Account
GOOGLE_SA_EMAIL=comet-portal-sheets@your-project.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Google Sheets Configuration (Optional - can also be set in Settings page)
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SHEETS_TAB_SUBMISSIONS=Submissions
GOOGLE_SHEETS_TAB_DAILY=DailyReports
```

**Important Notes:**
- The `GOOGLE_SA_PRIVATE_KEY` must be wrapped in quotes and include the `\n` characters
- Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- The private key from JSON already has `\n` characters, so keep them as is

### Option B: Using Settings Page (Database Configuration)

You can also configure the Google Sheet ID and tab names through the application's Settings page:

1. Log in to your application
2. Go to **Settings** page
3. Scroll to the **Google Sheets** section
4. Enter:
   - **Google Sheets ID**: Your sheet ID from Step 6
   - **Submissions Tab Name**: Name of the tab for form submissions (default: "Submissions")
   - **Daily Reports Tab Name**: Name of the tab for daily reports (default: "DailyReports")
5. Click **Save Settings**

**Note**: Service account credentials (`GOOGLE_SA_EMAIL` and `GOOGLE_SA_PRIVATE_KEY`) must always be set via environment variables for security.

---

## Step 8: Set Up Sheet Tabs (Optional but Recommended)

1. Open your Google Sheet
2. Create two tabs (if they don't exist):
   - **"Submissions"** - For form submissions
   - **"DailyReports"** - For daily reports
3. Add headers to the **Submissions** tab (optional, but helpful):
   - Row 1: `Timestamp`, `Form Title`, `Form ID`, `Phone Number`, `Submission Data`

The application will automatically append data to these tabs.

---

## Step 9: Deploy to Vercel (Production)

If you're deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `GOOGLE_SA_EMAIL`
   - **Value**: Your service account email
   - **Environment**: Production, Preview, Development (select all)
   
   - **Key**: `GOOGLE_SA_PRIVATE_KEY`
   - **Value**: Your private key (with quotes and `\n` characters)
   - **Environment**: Production, Preview, Development (select all)
   
   - **Key**: `GOOGLE_SHEETS_ID` (Optional if using Settings page)
   - **Value**: Your Google Sheet ID
   - **Environment**: Production, Preview, Development (select all)
   
   - **Key**: `GOOGLE_SHEETS_TAB_SUBMISSIONS` (Optional)
   - **Value**: `Submissions`
   - **Environment**: Production, Preview, Development (select all)
   
   - **Key**: `GOOGLE_SHEETS_TAB_DAILY` (Optional)
   - **Value**: `DailyReports`
   - **Environment**: Production, Preview, Development (select all)

4. **Redeploy** your application

---

## Step 10: Test the Integration

### Test Form Submission Export

1. Submit a form through your application
2. Check your Google Sheet - the submission should appear in the "Submissions" tab

### Test Manual Export

1. Go to **Dashboard** → **Reports**
2. Click **"Export to Google Sheets"**
3. Check your Google Sheet - submissions should be exported

### Test Daily Reports

1. Daily reports are automatically exported (if configured)
2. Check the "DailyReports" tab in your Google Sheet

---

## Troubleshooting

### Error: "Google Sheets credentials are missing"

**Solution**: Make sure `GOOGLE_SA_EMAIL` and `GOOGLE_SA_PRIVATE_KEY` are set in your environment variables.

### Error: "The caller does not have permission"

**Solution**: 
1. Make sure you've shared the Google Sheet with the service account email
2. The service account should have "Editor" permissions
3. Double-check the service account email matches exactly

### Error: "Requested entity was not found"

**Solution**: 
1. Verify the `GOOGLE_SHEETS_ID` is correct
2. Make sure the sheet exists and is accessible
3. Check that the sheet ID is extracted correctly from the URL

### Private Key Format Issues

**Solution**: 
- Make sure the private key is wrapped in quotes
- Keep the `\n` characters in the private key
- Include the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### Data Not Appearing in Sheets

**Solution**:
1. Check the browser console for errors
2. Verify the tab names match exactly (case-sensitive)
3. Make sure the service account has Editor permissions
4. Check that the sheet ID is correct

### Error: "Service account key creation is disabled" (Organization Policy)

**Symptom**: When trying to create a service account key, you see a modal saying "Service account key creation is disabled" with error about organization policy `iam.disableServiceAccountKeyCreation`.

**Causes**:
- Your Google Cloud project is part of an organization with security policies
- The organization has enabled "Secure by Default" which blocks service account key creation
- An Organization Policy Administrator has enforced this policy for security reasons

**Solutions**:

1. **Override the Policy Yourself** (If you have admin permissions):
   - Go to **IAM & Admin** → **Organization Policies** in Google Cloud Console
   - Search for `iam.disableServiceAccountKeyCreation`
   - Click on the constraint
   - Click **"Manage policy"** button
   - Select your project (e.g., "My First Project")
   - Change the policy to **"Not enforced"**
   - Click **"Save"**
   - Wait a few minutes, then try creating the key again

2. **Contact Your Organization Admin** (If you don't have permissions):
   - Find someone with the **Organization Policy Administrator** role (`roles/orgpolicy.policyAdmin`)
   - Share your project name/ID and ask them to override `iam.disableServiceAccountKeyCreation` for your project
   - They need to go to **IAM & Admin** → **Organization Policies** → Find `iam.disableServiceAccountKeyCreation` → Click "Manage policy" → Select your project → Set to "Not enforced"

2. **Create a New Personal Project** (If you're using a personal account):
   - If you're not part of an organization, this shouldn't happen
   - Try creating a completely new Google Cloud project
   - Make sure you're not accidentally using an organization-managed account

3. **Use Workload Identity Federation** (Advanced Alternative):
   - This is Google's recommended secure alternative
   - Doesn't require downloading service account keys
   - Works with Vercel and other platforms that support OIDC
   - More complex setup but more secure
   - See: [Workload Identity Federation Guide](https://cloud.google.com/iam/docs/workload-identity-federation)

4. **Check Project Settings**:
   - Go to **IAM & Admin** → **Settings**
   - Verify your project is not part of an organization
   - If it is, you'll need admin help to proceed

**Why This Policy Exists**: Google blocks service account key creation by default in organizations because:
- Service account keys are long-lived credentials that pose security risks
- If compromised, they can't be easily revoked
- Workload Identity Federation is the recommended secure alternative

**For Most Users**: If you're using a personal Google account and creating your own project, you shouldn't encounter this. If you do, it may be a temporary Google Cloud issue - try again later or create a new project.

---

## Security Best Practices

1. **Never commit service account credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Limit service account permissions** - only grant access to specific sheets
4. **Rotate keys periodically** if credentials are compromised
5. **Use different service accounts** for development and production

---

## How It Works

The integration uses Google Service Account authentication:

1. **Service Account**: Acts as a "robot user" that can access Google Sheets
2. **JWT Authentication**: Uses the service account's private key to authenticate
3. **API Access**: Uses Google Sheets API v4 to append data
4. **Automatic Export**: Form submissions are automatically exported when submitted
5. **Manual Export**: Users can manually export submissions via the Reports page

---

## Features

- ✅ **Automatic form submission export** - Submissions are sent to Google Sheets automatically
- ✅ **Manual export** - Export filtered submissions from the Reports page
- ✅ **Daily reports** - Automatic daily report generation
- ✅ **Configurable tabs** - Set custom tab names via Settings
- ✅ **Environment or database config** - Configure via env vars or Settings page

---

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the Google Sheet is shared with the service account
4. Check that Google Sheets API is enabled in your Google Cloud project
5. Review the troubleshooting section above

---

## Quick Reference

**Required Environment Variables:**
```env
GOOGLE_SA_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Optional Environment Variables:**
```env
GOOGLE_SHEETS_ID=your_sheet_id_here
GOOGLE_SHEETS_TAB_SUBMISSIONS=Submissions
GOOGLE_SHEETS_TAB_DAILY=DailyReports
```

**Or configure via Settings page:**
- Google Sheets ID
- Submissions Tab Name
- Daily Reports Tab Name

