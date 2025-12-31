# 🌱 How to Seed Admin User After Deployment

## Quick Steps

### 1. After Vercel Deployment Completes

Once your Vercel deployment is successful:

1. **Get your deployment URL** (e.g., `https://your-app.vercel.app`)

2. **Visit the seed endpoint:**
   ```
   https://your-app.vercel.app/api/seed?force=true
   ```

3. **You'll see a JSON response** with the created users and their credentials

---

## 📋 Methods to Trigger Seed Endpoint

### Method 1: Browser (Easiest)

1. Open your browser
2. Navigate to: `https://your-app.vercel.app/api/seed?force=true`
3. You'll see a JSON response showing created users

### Method 2: curl (Command Line)

```bash
curl https://your-app.vercel.app/api/seed?force=true
```

### Method 3: PowerShell (Windows)

```powershell
Invoke-WebRequest -Uri "https://your-app.vercel.app/api/seed?force=true"
```

### Method 4: Postman / API Client

- **Method:** GET
- **URL:** `https://your-app.vercel.app/api/seed?force=true`
- **Headers:** None required

---

## ✅ What Happens When You Seed

The seed endpoint will:

1. **Create Admin User** with all permissions:
   - Uses `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` from env vars (if set)
   - Or defaults to: `admin` / `admin@cometportal.com` / `admin123`

2. **Create Supervisor User** (optional):
   - Uses `SUPERVISOR_USERNAME`, `SUPERVISOR_EMAIL`, `SUPERVISOR_PASSWORD` from env vars (if set)
   - Or defaults to: `supervisor` / `supervisor@cometportal.com` / `supervisor123`

3. **Create Regular User** (optional):
   - Uses `USER_USERNAME`, `USER_EMAIL`, `USER_PASSWORD` from env vars (if set)
   - Or defaults to: `user` / `user@cometportal.com` / `user123`

---

## 📝 Example Response

```json
{
  "success": true,
  "message": "Users updated/created successfully",
  "data": {
    "usersCreated": 3,
    "users": [
      {
        "id": "65f1234567890abcdef12345",
        "name": "Admin User",
        "email": "admin@cometportal.com",
        "username": "admin",
        "role": "Admin"
      },
      {
        "id": "65f1234567890abcdef12346",
        "name": "Supervisor User",
        "email": "supervisor@cometportal.com",
        "username": "supervisor",
        "role": "Supervisor"
      },
      {
        "id": "65f1234567890abcdef12347",
        "name": "Regular User",
        "email": "user@cometportal.com",
        "username": "user",
        "role": "User"
      }
    ],
    "existingUsers": [],
    "credentials": {
      "admin": {
        "username": "admin",
        "email": "admin@cometportal.com",
        "password": "admin123"
      },
      "supervisor": {
        "username": "supervisor",
        "email": "supervisor@cometportal.com",
        "password": "supervisor123"
      },
      "user": {
        "username": "user",
        "email": "user@cometportal.com",
        "password": "user123"
      }
    }
  }
}
```

---

## 🔄 Using `force=true` Parameter

- **Without `force=true`:** Only creates users if they don't exist
- **With `force=true`:** Updates existing users with new passwords/data

**Recommendation:** Always use `?force=true` on first deployment to ensure admin is created.

---

## 🔐 Setting Custom Admin Credentials

### Step 1: Add Environment Variables in Vercel

Go to **Vercel Dashboard** → **Settings** → **Environment Variables**:

| Variable | Value | Example |
|----------|-------|---------|
| `ADMIN_NAME` | Admin's full name | `John Doe` |
| `ADMIN_EMAIL` | Admin's email | `admin@yourcompany.com` |
| `ADMIN_USERNAME` | Admin's username | `admin` |
| `ADMIN_PASSWORD` | Admin's password | `YourSecurePassword123!` |

### Step 2: Redeploy

After adding variables, redeploy your application.

### Step 3: Seed

Visit: `https://your-app.vercel.app/api/seed?force=true`

The response will show your custom credentials.

---

## 🚨 Troubleshooting

### "MongoServerError: Authentication failed"
- Check your `MONGODB_URI` in Vercel environment variables
- Verify MongoDB Atlas Network Access allows Vercel IPs

### "Users already exist"
- Use `?force=true` to update existing users
- Or manually delete users from MongoDB and seed again

### "Cannot GET /api/seed"
- Make sure the deployment completed successfully
- Check Vercel build logs for errors
- Verify the route file exists: `app/api/seed/route.ts`

### Seed endpoint returns error
- Check Vercel function logs
- Verify MongoDB connection is working
- Ensure all required environment variables are set

---

## 🔒 Security Best Practices

1. **Change default password immediately** after first login
2. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
3. **Set custom admin credentials** via environment variables
4. **Remove or protect the seed endpoint** in production (optional)
5. **Don't commit credentials** to Git

---

## 📍 Quick Reference

**Seed URL Format:**
```
https://[your-vercel-app].vercel.app/api/seed?force=true
```

**Default Admin Credentials:**
- Username: `admin`
- Email: `admin@cometportal.com`
- Password: `admin123`

**Login URL:**
```
https://[your-vercel-app].vercel.app
```

---

**After seeding, you can login and start using the application!** 🎉

