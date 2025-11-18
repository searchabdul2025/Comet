# Vercel Deployment Setup Guide

Your Comet Portal is deployed at: **https://portal-blue-zeta.vercel.app**

## Required Environment Variables in Vercel

Go to your Vercel project dashboard → **Settings** → **Environment Variables** and add:

### 1. MONGODB_URI
```
Key: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/comet-portal?retryWrites=true&w=majority
Environment: Production, Preview, Development (select all)
```

### 2. NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: [Generate a 32+ character secret - use: openssl rand -base64 32]
Environment: Production, Preview, Development (select all)
```

### 3. NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://portal-blue-zeta.vercel.app
Environment: Production, Preview, Development (select all)
```

## Post-Deployment Steps

### 1. Seed Initial Users

After setting environment variables and deployment completes, visit:
```
https://portal-blue-zeta.vercel.app/api/seed?force=true
```

This will create:
- **Admin**: admin@cometportal.com / admin123
- **Supervisor**: supervisor@cometportal.com / supervisor123
- **User**: user@cometportal.com / user123

### 2. Test the Application

1. Visit: https://portal-blue-zeta.vercel.app
2. Login with one of the seeded accounts
3. Test different features based on role permissions

### 3. Verify Environment Variables

Test the API connection:
```
https://portal-blue-zeta.vercel.app/api/test
```

Should return:
```json
{
  "success": true,
  "message": "API test successful",
  "data": {
    "database": "connected",
    "authenticated": false,
    "users": 3,
    "forms": 0
  }
}
```

## Troubleshooting

### "MongoServerError: Authentication failed"
- Check your MongoDB username and password in `MONGODB_URI`
- Ensure MongoDB Atlas network access allows Vercel IPs (or allow all IPs: 0.0.0.0/0)

### "NEXTAUTH_SECRET is missing"
- Add `NEXTAUTH_SECRET` in Vercel environment variables
- Redeploy after adding

### "Invalid NEXTAUTH_URL"
- Ensure `NEXTAUTH_URL` is exactly: `https://portal-blue-zeta.vercel.app`
- No trailing slash
- Use `https://` not `http://`

### Environment variables not working
- Make sure you selected all environments (Production, Preview, Development)
- Redeploy after adding/changing variables
- Check for typos in variable names (case-sensitive)

## MongoDB Atlas Network Access

If using MongoDB Atlas, ensure your network access allows Vercel:

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Either:
   - Add `0.0.0.0/0` to allow all IPs (for testing)
   - Or add specific Vercel IP ranges (check Vercel docs)

## Custom Domain (Optional)

If you want to use a custom domain:

1. Go to Vercel → Your Project → Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` to your custom domain
4. Redeploy

## Monitoring

- Check deployment logs in Vercel dashboard
- Monitor build logs for errors
- Check function logs for runtime errors

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Test MongoDB connection separately
4. Check NextAuth.js configuration

---

**Your Live App**: https://portal-blue-zeta.vercel.app

