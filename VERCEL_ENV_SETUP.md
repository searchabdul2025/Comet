# Vercel Environment Variables Setup - Quick Guide

## ⚠️ IMPORTANT: Set These Variables in Vercel

Your app is failing because `NEXTAUTH_SECRET` is missing. Follow these steps:

## Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your project: **comet-rho-one** (or your project name)
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

## Step 2: Add Required Environment Variables

Add these **3 required variables**:

### 1. MONGODB_URI

**Key**: `MONGODB_URI`

**Value**: Your MongoDB connection string
```
mongodb+srv://username:password@cluster.mongodb.net/comet-portal?retryWrites=true&w=majority
```

**Environment**: Select all (Production, Preview, Development)

---

### 2. NEXTAUTH_SECRET ⚠️ (MISSING - This is causing your error)

**Key**: `NEXTAUTH_SECRET`

**Value**: Generate a secret key (32+ characters)

**How to generate**:
- **Online**: Visit https://generate-secret.vercel.app/32
- **PowerShell**: 
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```
- **Linux/Mac**: `openssl rand -base64 32`

**Example value** (generate your own!):
```
w3Hmly3Cj5KUVmmQ9G/erYOgeUFqH7t+AWeA+u3Cn7g=
```

**Environment**: Select all (Production, Preview, Development)

---

### 3. NEXTAUTH_URL

**Key**: `NEXTAUTH_URL`

**Value**: Your Vercel app URL
```
https://comet-rho-one.vercel.app
```

**Important**: 
- Use `https://` (not `http://`)
- No trailing slash
- Match your actual Vercel deployment URL

**Environment**: Select all (Production, Preview, Development)

---

## Step 3: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click the **3 dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic redeploy

---

## Step 4: Verify It Works

After redeployment, visit:
- `https://comet-rho-one.vercel.app` - Should load without errors
- `https://comet-rho-one.vercel.app/api/test` - Should return success

---

## Optional: Google Sheets Integration

If you need Google Sheets export, also add:

- `GOOGLE_SA_EMAIL`
- `GOOGLE_SA_PRIVATE_KEY`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SHEETS_TAB_SUBMISSIONS`
- `GOOGLE_SHEETS_TAB_DAILY`

See `GOOGLE_SHEETS_SETUP.md` for details.

---

## Troubleshooting

### Error: "NEXTAUTH_SECRET is missing"

✅ **Solution**: Add `NEXTAUTH_SECRET` in Vercel → Settings → Environment Variables

### Error: "MongoServerError: Authentication failed"

✅ **Solution**: Check your `MONGODB_URI` - verify username and password are correct

### Environment variables not working after adding

✅ **Solution**: 
1. Make sure you selected all environments (Production, Preview, Development)
2. Redeploy your application
3. Wait a few minutes for the deployment to complete

---

## Quick Checklist

- [ ] Added `MONGODB_URI` in Vercel
- [ ] Added `NEXTAUTH_SECRET` in Vercel (generated a new secret)
- [ ] Added `NEXTAUTH_URL` in Vercel (your app URL)
- [ ] Selected all environments for each variable
- [ ] Redeployed the application
- [ ] Tested the app - no more errors!

---

**Need Help?** Check the deployment logs in Vercel dashboard for specific error messages.

