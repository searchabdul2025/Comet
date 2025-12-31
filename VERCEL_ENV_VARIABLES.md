# Vercel Environment Variables Setup

## 📋 Your Google Sheet Information

**Sheet URL:** https://docs.google.com/spreadsheets/d/1CB5eSJEzntpzOujFy-vWmosxSBuwHrqxEzLhc0L62IA/edit

**Sheet ID:** `1CB5eSJEzntpzOujFy-vWmosxSBuwHrqxEzLhc0L62IA`

**Service Account Email:** `comet-557@portal-481920.iam.gserviceaccount.com`

---

## ✅ Step 1: Share Your Google Sheet

**IMPORTANT:** Before adding environment variables, share your Google Sheet with the service account:

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1CB5eSJEzntpzOujFy-vWmosxSBuwHrqxEzLhc0L62IA/edit
2. Click the **"Share"** button (top right)
3. Paste this email: `comet-557@portal-481920.iam.gserviceaccount.com`
4. Give it **"Editor"** permissions
5. Click **"Send"** (uncheck "Notify people" if you want)

---

## ✅ Step 2: Add Environment Variables to Vercel

Go to your Vercel project dashboard:
1. Navigate to **Settings** → **Environment Variables**
2. Add each variable below (one by one)

### Variable 1: MONGODB_URI

- **Key:** `MONGODB_URI`
- **Value:** `mongodb+srv://cometportal:RTXon5nhPG9uu0dW@cluster0.ycmpf1i.mongodb.net/comet-portal?appName=Cluster0`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

**⚠️ Important:** 
- This is your MongoDB Atlas connection string
- The database name `comet-portal` is included in the connection string
- Make sure your MongoDB Atlas cluster allows connections from Vercel (Network Access settings)

### Variable 2: NEXTAUTH_SECRET

- **Key:** `NEXTAUTH_SECRET`
- **Value:** Generate a random secret (minimum 32 characters)
- **How to generate:**
  - **Online:** https://generate-secret.vercel.app/32
  - **PowerShell:** `-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

**⚠️ Important:** 
- Must be at least 32 characters long
- Use a different secret for production
- Never commit this to version control

### Variable 3: NEXTAUTH_URL

- **Key:** `NEXTAUTH_URL`
- **Value:** Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- **Note:** Vercel usually sets this automatically, but you can override it
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### Variable 4: GOOGLE_SA_EMAIL

- **Key:** `GOOGLE_SA_EMAIL`
- **Value:** `comet-557@portal-481920.iam.gserviceaccount.com`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### Variable 5: GOOGLE_SA_PRIVATE_KEY

- **Key:** `GOOGLE_SA_PRIVATE_KEY`
- **Value:** (Copy the entire value below, including quotes)
```
"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC9KqTbnXYaCP1k\naVAL3hiye7CcfNqztm50F16o08bsMwME7DMPZJLqjbTndVEehK0bbFJmN1u+ZtPN\nytUB5uY+snuAoYu4LntEjdxUCcTST/u/COPRMUgUUuyNoyXgwKUojgZBK3zXJBsX\nENvHipXAkFM6m2R9NSMZIqIePnyL8fQgL0pBJVvoxj0JXDQRL/WhxKtBr6AkqHcB\n3Zw3skXsWKY7nIKDOJoIFGLqaPAViydU4j4p3DE/8RMpOBd0f9gRg7CEXabx7pFi\nH1z8hjZdwXD5DClNrinhIgmBV77l4kDeDYRFer5I3S1Xt3jQe2T2luRO35/+xeBN\nVEWEDPd1AgMBAAECggEAK/zIFBdz+I7hmWFRz0iodoyDn4f69TI1UgKDLP/98DvW\ndmUUZH5vGWK1T+M8ZzvT4x4XtRQnXcmcc+y4BnayUJ8BUAKAsmYAnQrd0p7o6TzX\nHe+Lxj/O8obr4e2vp6k0Xo9UDgB2SbLoJ79wU+C6fOoyqFytC9542GXwy9ac8I9+\nm/u5Mp02mKwAUYyLAd4h154HCO4YlkgCSZqGoxkcpsR4jBdtaGkORdUarjmy3e5L\nvd7PvFDX1/kWu8JPKkPmRxseYwbRwpP3iOn7WZ1nyTBUnmYvyYDQjhXbm+vEUx20\nc5dLYwUkCLPDbiLUSutF4+2lLk9W4evpcq/6YIudAQKBgQDuAcaSuZi3acyiXfkD\nD/ZbRGmvvXTta1Hz68AC5s9s+SyS9xbaBvgvytDiACYog5Slswfe2nqPbZa7OBZp\nhrN1Vv5Ann/x747K3wn0y50/Hnv6O2Q/CSQ9g6YJjM+8dMatwFDyL1jTu3iva3os\nlBZW3t3tM5DlwdNIYAgI1YUp9QKBgQDLd6UuDb7MmIg/lmIh1lg5GPImMZZMwEQE\nC9RnbCd7U2RCw6USPiPUUKSMSl3oUzFZNDePV9aL8d4w6/LSR40p+ZWY6tOW7vFh\n7Md5e8J3JiOPNDSzJhkngXwjrCP0LpGMj06KieYHYY91ySBWpZO/4lP6wtaQn7nZ\nuY0pdsSngQKBgB++guKs+G52IQIC8KR065HOtR3ocgD8kGitJ+X7LO1G6qgLZrPb\nvBx7u5J5HJ3ItvnGwCT8FN6uai08VNjsS2E6Ih0yRrRZFD2AtA4/XhC+GyEL7Nnv\neTLvLSUW79od5SXlgaZbpEhRN86F0jzB35zkissJVqkeSfTcQhYTjHhFAoGAXllu\n2To6fblFhOcBPlucsW1l7FwWLCUD5TRvHD5E2KVE2sjKZPk3uB5lD0D05uSc/5Z9\nJRVAQci4lcrz4JqZVRuNSUmrMFRAzn3zydufw4yF9MPqpCBIjc83d3s9eN+XUqyp\naQilCEsvMRlAy60gJFyZQLDUul+22MV4NgADFQECgYBAKQkyuEDdgy0GWQkNthK5\nqsyElXFwQz7KCGaHK+DgIgKkcOe0M2gBhDkH35rb5w8Npy0k9iLmZ8N9X6r7qmG1\nXoHCoALESiaBgcqMxRxN1CvXkHbVoF1yfYjuysbm/KrO5z/iUJPthne17l+tB72J\nfdjhtig8sxr7nNhrHaZJ1g==\n-----END PRIVATE KEY-----\n"
```
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

**⚠️ Important:** 
- Include the quotes at the beginning and end
- Keep all the `\n` characters exactly as shown
- Copy the entire value including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### Variable 6: GOOGLE_SHEETS_ID

- **Key:** `GOOGLE_SHEETS_ID`
- **Value:** `1CB5eSJEzntpzOujFy-vWmosxSBuwHrqxEzLhc0L62IA`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### Variable 7: GOOGLE_SHEETS_TAB_SUBMISSIONS

- **Key:** `GOOGLE_SHEETS_TAB_SUBMISSIONS`
- **Value:** `Submissions`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### Variable 8: GOOGLE_SHEETS_TAB_DAILY

- **Key:** `GOOGLE_SHEETS_TAB_DAILY`
- **Value:** `DailyReports`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

---

## ✅ Optional: Custom Admin Credentials

If you want to set custom admin credentials (instead of defaults), add these variables:

### Variable 9: ADMIN_NAME (Optional)

- **Key:** `ADMIN_NAME`
- **Value:** `Your Admin Name` (e.g., `John Doe`)
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### Variable 10: ADMIN_EMAIL (Optional)

- **Key:** `ADMIN_EMAIL`
- **Value:** `your-admin@email.com`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### Variable 11: ADMIN_USERNAME (Optional)

- **Key:** `ADMIN_USERNAME`
- **Value:** `admin` (or your preferred username)
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### Variable 12: ADMIN_PASSWORD (Optional)

- **Key:** `ADMIN_PASSWORD`
- **Value:** `YourSecurePassword123!` (use a strong password)
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

**⚠️ Important:** 
- If you don't set these, the seed script will use defaults:
  - Username: `admin`
  - Email: `admin@cometportal.com`
  - Password: `admin123`
- **Change the default password immediately after first login!**

---

## ✅ Step 3: Create Sheet Tabs (Optional but Recommended)

1. Open your Google Sheet
2. Create these tabs at the bottom:
   - **"Submissions"** - For form submissions
   - **"DailyReports"** - For daily reports

The app will automatically add data, but having tabs ready helps organize.

---

## ✅ Step 4: Redeploy Your Application

After adding all environment variables:

1. Go to your Vercel project dashboard
2. Click on **Deployments** tab
3. Click the **"..."** menu on the latest deployment
4. Click **"Redeploy"**
   - Or push a new commit to trigger a redeploy

---

## ✅ Step 5: Seed Admin User

After deployment completes, seed the admin user:

1. Visit your Vercel deployment URL + `/api/seed?force=true`
   - Example: `https://your-app.vercel.app/api/seed?force=true`
2. This will create:
   - **Admin user** (with custom credentials if you set them, or defaults)
   - **Supervisor user** (optional, for testing)
   - **Regular user** (optional, for testing)
3. The response will show you the created credentials

**Default Admin Credentials (if not set via env vars):**
- **Username:** `admin`
- **Email:** `admin@cometportal.com`
- **Password:** `admin123`

**⚠️ Security:** Change the default password immediately after first login!

---

## ✅ Step 6: Test the Integration

1. After seeding, login with your admin credentials
2. Submit a test form through your application
3. Check your Google Sheet → "Submissions" tab
4. You should see a new row with the submission data!

---

## 📋 Quick Reference - All Variables

Here's a summary of all variables to add:

| Variable Name | Value | Required |
|--------------|-------|----------|
| `MONGODB_URI` | `mongodb+srv://cometportal:RTXon5nhPG9uu0dW@cluster0.ycmpf1i.mongodb.net/comet-portal?appName=Cluster0` | ✅ Yes |
| `NEXTAUTH_SECRET` | Generate a random 32+ character string | ✅ Yes |
| `NEXTAUTH_URL` | Your Vercel app URL (e.g., `https://your-app.vercel.app`) | ✅ Yes |
| `GOOGLE_SA_EMAIL` | `comet-557@portal-481920.iam.gserviceaccount.com` | ⚠️ If using Google Sheets |
| `GOOGLE_SA_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` | ⚠️ If using Google Sheets |
| `GOOGLE_SHEETS_ID` | `1CB5eSJEzntpzOujFy-vWmosxSBuwHrqxEzLhc0L62IA` | ⚠️ If using Google Sheets |
| `GOOGLE_SHEETS_TAB_SUBMISSIONS` | `Submissions` | ⚠️ If using Google Sheets |
| `GOOGLE_SHEETS_TAB_DAILY` | `DailyReports` | ⚠️ If using Google Sheets |
| `ADMIN_NAME` | `Your Admin Name` | ⚪ Optional (defaults to "Admin User") |
| `ADMIN_EMAIL` | `your-admin@email.com` | ⚪ Optional (defaults to "admin@cometportal.com") |
| `ADMIN_USERNAME` | `admin` | ⚪ Optional (defaults to "admin") |
| `ADMIN_PASSWORD` | `YourSecurePassword123!` | ⚪ Optional (defaults to "admin123") |

---

## 🔒 Security Notes

- ✅ Never commit these values to Git
- ✅ Vercel encrypts environment variables
- ✅ Use different service accounts for dev/production if possible
- ✅ Rotate keys periodically

---

## 🐛 Troubleshooting

### If data doesn't appear in sheets:

1. **Check Sheet Sharing:**
   - Make sure the sheet is shared with `comet-557@portal-481920.iam.gserviceaccount.com`
   - Service account must have **Editor** permissions

2. **Check Environment Variables:**
   - Verify all required variables are set in Vercel (MongoDB, NextAuth, Google Sheets)
   - Make sure `GOOGLE_SA_PRIVATE_KEY` has quotes and `\n` characters
   - Verify `MONGODB_URI` is correctly set
   - Ensure `NEXTAUTH_SECRET` is at least 32 characters

3. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → **Deployments** → Click on a deployment → **Logs**
   - Look for any Google Sheets API errors

4. **Verify Sheet ID:**
   - Double-check the Sheet ID matches: `1CB5eSJEzntpzOujFy-vWmosxSBuwHrqxEzLhc0L62IA`

### If MongoDB connection fails:

1. **Check MongoDB Atlas Network Access:**
   - Go to MongoDB Atlas → **Network Access**
   - Add `0.0.0.0/0` (allow all IPs) or add Vercel's IP ranges
   - Wait 1-2 minutes for changes to propagate

2. **Verify Connection String:**
   - Make sure the username and password are correct
   - Check that the cluster name matches: `cluster0.ycmpf1i.mongodb.net`

3. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → **Deployments** → Click on a deployment → **Logs**
   - Look for MongoDB connection errors

---

**Once set up, your application will connect to MongoDB and form submissions will automatically export to your Google Sheet!** 🎉

---

## 🔐 Admin User Seeding

### Quick Seed (Using Defaults)

Visit this URL after deployment:
```
https://your-app.vercel.app/api/seed?force=true
```

This creates:
- Admin: `admin` / `admin@cometportal.com` / `admin123`
- Supervisor: `supervisor` / `supervisor@cometportal.com` / `supervisor123`
- User: `user` / `user@cometportal.com` / `user123`

### Custom Admin Credentials

1. Add environment variables in Vercel:
   - `ADMIN_NAME` - Admin's full name
   - `ADMIN_EMAIL` - Admin's email
   - `ADMIN_USERNAME` - Admin's username
   - `ADMIN_PASSWORD` - Admin's password (use a strong password!)

2. Redeploy your application

3. Visit: `https://your-app.vercel.app/api/seed?force=true`

4. The response will show your custom admin credentials

**Note:** The `?force=true` parameter will update existing users if they already exist.


