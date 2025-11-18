# Vercel Environment Variables - Exact Values

Copy these values to your Vercel project → Settings → Environment Variables

## 1. MONGODB_URI

**Key**: `MONGODB_URI`

**Value** (replace `<db_password>` with your actual MongoDB password):
```
mongodb+srv://aqstoria_db_user:<db_password>@cluster0.ieh1nqe.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0
```

**Important**: 
- Replace `<db_password>` with your actual MongoDB Atlas password
- Make sure to URL-encode special characters in your password (e.g., `@` becomes `%40`, `#` becomes `%23`)

**Example** (if your password is `MyP@ssw0rd#123`):
```
mongodb+srv://aqstoria_db_user:MyP%40ssw0rd%23123@cluster0.ieh1nqe.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0
```

**Environment**: Select all (Production, Preview, Development)

---

## 2. NEXTAUTH_SECRET

**Key**: `NEXTAUTH_SECRET`

**Value** (generate a new one - this is just an example):
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**How to generate your own**:
- **Online**: Visit https://generate-secret.vercel.app/32
- **Linux/Mac**: Run `openssl rand -base64 32`
- **Windows PowerShell**: 
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```

**Requirements**:
- Must be at least 32 characters long
- Use a different secret for production (don't use the example above)
- Keep it secure and never share it

**Environment**: Select all (Production, Preview, Development)

---

## 3. NEXTAUTH_URL

**Key**: `NEXTAUTH_URL`

**Value**:
```
https://portal-blue-zeta.vercel.app
```

**Important**: 
- Use `https://` (not `http://`)
- No trailing slash at the end
- This must match your actual Vercel deployment URL

**Environment**: Select all (Production, Preview, Development)

---

## Quick Copy-Paste Template

After replacing `<db_password>` with your actual password and generating a NEXTAUTH_SECRET:

### In Vercel Dashboard:

1. **MONGODB_URI**:
   ```
   mongodb+srv://aqstoria_db_user:YOUR_PASSWORD_HERE@cluster0.ieh1nqe.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0
   ```

2. **NEXTAUTH_SECRET**:
   ```
   YOUR_GENERATED_32_CHARACTER_SECRET_HERE
   ```

3. **NEXTAUTH_URL**:
   ```
   https://portal-blue-zeta.vercel.app
   ```

---

## Step-by-Step Setup in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: **portal**
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Add each variable:
   - Click **Add New**
   - Enter the **Key** (e.g., `MONGODB_URI`)
   - Enter the **Value** (paste from above)
   - Select **Production**, **Preview**, and **Development**
   - Click **Save**
6. Repeat for all 3 variables
7. Go to **Deployments** tab
8. Click the **"..."** menu on the latest deployment
9. Click **Redeploy**

---

## After Setting Variables

1. **Wait for redeployment** to complete
2. **Seed users** by visiting:
   ```
   https://portal-blue-zeta.vercel.app/api/seed?force=true
   ```
3. **Test login** at:
   ```
   https://portal-blue-zeta.vercel.app
   ```
   - Admin: `admin@cometportal.com` / `admin123`
   - Supervisor: `supervisor@cometportal.com` / `supervisor123`
   - User: `user@cometportal.com` / `user123`

---

## Troubleshooting

### If MongoDB connection fails:
- Check that your password is correct
- URL-encode special characters in password
- Verify MongoDB Atlas Network Access allows all IPs (0.0.0.0/0) or Vercel IPs

### If authentication doesn't work:
- Verify NEXTAUTH_SECRET is set (check Vercel logs)
- Ensure NEXTAUTH_URL matches your deployment URL exactly
- Check for typos in variable names (they're case-sensitive)

### To verify variables are set:
- Check Vercel deployment logs
- Visit: `https://portal-blue-zeta.vercel.app/api/test`
- Should return success message

---

## Security Notes

⚠️ **Never commit these values to Git**
- `.env.local` is already in `.gitignore`
- These values are only stored in Vercel's secure environment variables
- Don't share your actual passwords or secrets publicly

