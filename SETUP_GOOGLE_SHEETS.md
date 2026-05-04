# Your Google Sheets Setup - Step by Step

## ✅ Step 1: Add Credentials to .env.local

Open your `.env.local` file (create it if it doesn't exist) and add these lines:

```env
# Google Sheets Service Account
GOOGLE_SA_EMAIL=comet-557@portal-481920.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC9KqTbnXYaCP1k\naVAL3hiye7CcfNqztm50F16o08bsMwME7DMPZJLqjbTndVEehK0bbFJmN1u+ZtPN\nytUB5uY+snuAoYu4LntEjdxUCcTST/u/COPRMUgUUuyNoyXgwKUojgZBK3zXJBsX\nENvHipXAkFM6m2R9NSMZIqIePnyL8fQgL0pBJVvoxj0JXDQRL/WhxKtBr6AkqHcB\n3Zw3skXsWKY7nIKDOJoIFGLqaPAViydU4j4p3DE/8RMpOBd0f9gRg7CEXabx7pFi\nH1z8hjZdwXD5DClNrinhIgmBV77l4kDeDYRFer5I3S1Xt3jQe2T2luRO35/+xeBN\nVEWEDPd1AgMBAAECggEAK/zIFBdz+I7hmWFRz0iodoyDn4f69TI1UgKDLP/98DvW\ndmUUZH5vGWK1T+M8ZzvT4x4XtRQnXcmcc+y4BnayUJ8BUAKAsmYAnQrd0p7o6TzX\nHe+Lxj/O8obr4e2vp6k0Xo9UDgB2SbLoJ79wU+C6fOoyqFytC9542GXwy9ac8I9+\nm/u5Mp02mKwAUYyLAd4h154HCO4YlkgCSZqGoxkcpsR4jBdtaGkORdUarjmy3e5L\nvd7PvFDX1/kWu8JPKkPmRxseYwbRwpP3iOn7WZ1nyTBUnmYvyYDQjhXbm+vEUx20\nc5dLYwUkCLPDbiLUSutF4+2lLk9W4evpcq/6YIudAQKBgQDuAcaSuZi3acyiXfkD\nD/ZbRGmvvXTta1Hz68AC5s9s+SyS9xbaBvgvytDiACYog5Slswfe2nqPbZa7OBZp\nhrN1Vv5Ann/x747K3wn0y50/Hnv6O2Q/CSQ9g6YJjM+8dMatwFDyL1jTu3iva3os\nlBZW3t3tM5DlwdNIYAgI1YUp9QKBgQDLd6UuDb7MmIg/lmIh1lg5GPImMZZMwEQE\nC9RnbCd7U2RCw6USPiPUUKSMSl3oUzFZNDePV9aL8d4w6/LSR40p+ZWY6tOW7vFh\n7Md5e8J3JiOPNDSzJhkngXwjrCP0LpGMj06KieYHYY91ySBWpZO/4lP6wtaQn7nZ\nuY0pdsSngQKBgB++guKs+G52IQIC8KR065HOtR3ocgD8kGitJ+X7LO1G6qgLZrPb\nvBx7u5J5HJ3ItvnGwCT8FN6uai08VNjsS2E6Ih0yRrRZFD2AtA4/XhC+GyEL7Nnv\neTLvLSUW79od5SXlgaZbpEhRN86F0jzB35zkissJVqkeSfTcQhYTjHhFAoGAXllu\n2To6fblFhOcBPlucsW1l7FwWLCUD5TRvHD5E2KVE2sjKZPk3uB5lD0D05uSc/5Z9\nJRVAQci4lcrz4JqZVRuNSUmrMFRAzn3zydufw4yF9MPqpCBIjc83d3s9eN+XUqyp\naQilCEsvMRlAy60gJFyZQLDUul+22MV4NgADFQECgYBAKQkyuEDdgy0GWQkNthK5\nqsyElXFwQz7KCGaHK+DgIgKkcOe0M2gBhDkH35rb5w8Npy0k9iLmZ8N9X6r7qmG1\nXoHCoALESiaBgcqMxRxN1CvXkHbVoF1yfYjuysbm/KrO5z/iUJPthne17l+tB72J\nfdjhtig8sxr7nNhrHaZJ1g==\n-----END PRIVATE KEY-----\n"
```

**⚠️ Important:**
- The `GOOGLE_SA_PRIVATE_KEY` must be wrapped in **double quotes**
- Keep all the `\n` characters as they are
- Include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

## ✅ Step 2: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet (or use an existing one)
3. **Get the Sheet ID from the URL**:
   - Example URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - Sheet ID is: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` (the long string between `/d/` and `/edit`)

## ✅ Step 3: Share Sheet with Service Account

1. In your Google Sheet, click the **"Share"** button (top right)
2. Paste this email: `comet-557@portal-481920.iam.gserviceaccount.com`
3. Give it **"Editor"** permissions
4. Click **"Send"** (you can uncheck "Notify people")

## ✅ Step 4: Add Sheet Configuration

Add these to your `.env.local` file (replace with your actual Sheet ID):

```env
# Google Sheets Configuration
GOOGLE_SHEETS_ID=YOUR_SHEET_ID_HERE
GOOGLE_SHEETS_TAB_SUBMISSIONS=Submissions
GOOGLE_SHEETS_TAB_DAILY=DailyReports
```

**Or** you can set these via the Settings page in your app (after logging in as admin).

## ✅ Step 5: Create Sheet Tabs (Optional but Recommended)

1. In your Google Sheet, create these tabs:
   - **"Submissions"** - For form submissions
   - **"DailyReports"** - For daily reports

The app will automatically create rows, but having tabs ready is helpful.

## ✅ Step 6: Test It!

1. Restart your development server (if running):
   ```bash
   npm run dev
   ```

2. Submit a test form through your application

3. Check your Google Sheet → "Submissions" tab
   - You should see a new row with the submission data!

## 🚀 For Vercel (Production)

When deploying to Vercel, add these environment variables:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add each variable:
   - `GOOGLE_SA_EMAIL` = `comet-557@portal-481920.iam.gserviceaccount.com`
   - `GOOGLE_SA_PRIVATE_KEY` = (the full private key with quotes)
   - `GOOGLE_SHEETS_ID` = (your sheet ID)
   - `GOOGLE_SHEETS_TAB_SUBMISSIONS` = `Submissions`
   - `GOOGLE_SHEETS_TAB_DAILY` = `DailyReports`
3. Select **Production, Preview, Development** for each
4. **Redeploy** your application

## ✅ What Happens Next

Once set up:
- ✅ **Form submissions** are automatically exported to Google Sheets
- ✅ You can **manually export** from Dashboard → Reports
- ✅ **Daily reports** are automatically generated
- ✅ You can **delete submissions** from Google Sheets via the admin panel

## 🔒 Security Reminder

- ✅ `.env.local` is already in `.gitignore` (won't be committed)
- ✅ Never share your private key publicly
- ✅ Use different service accounts for dev/production if possible

---

**Need Help?** If you encounter any errors, check the browser console and see `GOOGLE_SHEETS_SETUP.md` for troubleshooting.



