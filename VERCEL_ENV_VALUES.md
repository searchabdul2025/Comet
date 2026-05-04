# Vercel Environment Variables - Exact Values

Copy these values to your Vercel project → Settings → Environment Variables

## 1. MONGODB_URI

**Key**: `MONGODB_URI`

**Value**:
```
mongodb+srv://aqstoria_db_user:olH07V3q5RDbij9n@cluster0.ieh1nqe.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0
```

**Note**: This is your actual MongoDB password from your local setup.

**Environment**: Select all (Production, Preview, Development)

---

## 2. NEXTAUTH_SECRET

**Key**: `NEXTAUTH_SECRET`

**Value** (from your local setup):
```
w3Hmly3Cj5KUVmmQ9G/erYOgeUFqH7t+AWeA+u3Cn7g=
```

**Note**: This is your actual NEXTAUTH_SECRET from your local `.env.local` file.

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
   mongodb+srv://aqstoria_db_user:olH07V3q5RDbij9n@cluster0.ieh1nqe.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0
   ```

2. **NEXTAUTH_SECRET**:
   ```
   w3Hmly3Cj5KUVmmQ9G/erYOgeUFqH7t+AWeA+u3Cn7g=
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

