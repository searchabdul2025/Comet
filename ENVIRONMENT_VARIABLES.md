# Environment Variables Guide

This document lists all environment variables required for the Comet Portal application.

## Required Environment Variables

### 1. `MONGODB_URI`
**Description**: MongoDB database connection string  
**Required**: Yes  
**Example (Local)**: 
```
MONGODB_URI=mongodb://localhost:27017/comet-portal
```

**Example (MongoDB Atlas)**:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0
```

**How to get**:
- **Local**: Install MongoDB locally and use `mongodb://localhost:27017/comet-portal`
- **Atlas**: 
  1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  2. Create a free cluster
  3. Click "Connect" → "Connect your application"
  4. Copy the connection string
  5. Replace `<password>` with your database user password
  6. Replace `<dbname>` with `comet-portal` (or your preferred database name)

---

### 2. `NEXTAUTH_SECRET`
**Description**: Secret key for NextAuth.js session encryption and JWT signing  
**Required**: Yes  
**Example**: 
```
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
```

**How to generate**:
- **Linux/Mac**: `openssl rand -base64 32`
- **Windows PowerShell**: 
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```
- **Online**: https://generate-secret.vercel.app/32

**Important**: 
- Must be at least 32 characters long
- Use a different secret for production
- Never commit this to version control

---

### 3. `NEXTAUTH_URL`
**Description**: The canonical URL of your site (used for OAuth callbacks)  
**Required**: Yes  
**Example (Local Development)**:
```
NEXTAUTH_URL=http://localhost:3000
```

**Example (Production)**:
```
NEXTAUTH_URL=https://your-app.vercel.app
```

**How to set**:
- **Local**: Always use `http://localhost:3000`
- **Vercel**: Vercel automatically sets this, but you can override it
- **Custom Domain**: Use your full domain (e.g., `https://portal.yourdomain.com`)

---

## Optional Environment Variables

### `NODE_ENV`
**Description**: Node.js environment mode  
**Default**: `development` (when running `npm run dev`) or `production` (when running `npm run build`)  
**Example**:
```
NODE_ENV=production
```

**Note**: Usually set automatically by Next.js, but you can override if needed.

---

## Environment Variable Setup

### Local Development

1. Create a `.env.local` file in the root directory:
```bash
# Windows
copy .env.example .env.local

# Linux/Mac
cp .env.example .env.local
```

2. Edit `.env.local` and fill in your values:
```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/comet-portal
NEXTAUTH_SECRET=your-generated-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

3. Restart your development server:
```bash
npm run dev
```

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
   - **Environment**: Production, Preview, Development (select all)
   
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: Your generated secret (32+ characters)
   - **Environment**: Production, Preview, Development (select all)
   
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://portal-blue-zeta.vercel.app` (or your custom domain)
   - **Environment**: Production, Preview, Development (select all)

4. Redeploy your application

### Other Platforms

For other hosting platforms (AWS, DigitalOcean, etc.), set environment variables according to their documentation. The same variables are required.

---

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use different secrets for different environments** - Don't reuse production secrets in development
3. **Rotate secrets regularly** - Especially if they're exposed
4. **Use strong MongoDB passwords** - At least 16 characters with mixed case, numbers, and symbols
5. **Restrict MongoDB network access** - Only allow connections from your Vercel IPs or specific IPs

---

## Verification

After setting up environment variables, verify they're working:

1. **Check MongoDB connection**:
   - Visit: `http://localhost:3000/api/test`
   - Should return: `{"success":true,"message":"API test successful",...}`

2. **Check authentication**:
   - Try logging in with seeded users
   - Visit: `http://localhost:3000/api/seed?force=true` to seed users first

3. **Check environment variables are loaded**:
   - The app should start without errors
   - Check console for any missing variable warnings

---

## Troubleshooting

### "MongoServerError: Authentication failed"
- Check your MongoDB username and password in `MONGODB_URI`
- Ensure your MongoDB user has proper permissions

### "NEXTAUTH_SECRET is missing"
- Make sure `.env.local` exists and contains `NEXTAUTH_SECRET`
- Restart your development server after adding variables

### "Invalid NEXTAUTH_URL"
- Ensure `NEXTAUTH_URL` matches your actual domain
- For local development, use `http://localhost:3000`
- For production, use `https://your-domain.com` (no trailing slash)

### Environment variables not loading
- Make sure the file is named `.env.local` (not `.env` or `.env.development`)
- Restart your development server
- Check for typos in variable names (they're case-sensitive)

---

## Quick Reference

```env
# Copy this template to .env.local

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/comet-portal?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_SECRET=generate-a-32-character-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## Support

If you encounter issues with environment variables:
1. Check the console for specific error messages
2. Verify all required variables are set
3. Ensure no typos in variable names
4. Restart your development server after changes

