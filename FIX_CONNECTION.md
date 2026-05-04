# Quick Fix for MongoDB Connection Error

## The Problem
Error: `querySrv ENOTFOUND _mongodb._tcp.clustero.iehlnqe.mongodb.net`

This is a DNS resolution issue. Let's fix it:

## Solution 1: Get Fresh Connection String (Recommended)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Click "Connect"** on your cluster
3. **Choose "Connect your application"**
4. **Copy the connection string** - it should look like:
   ```
   mongodb+srv://aqstoria_db_user:<password>@clustero.iehlnqe.mongodb.net/?appName=Cluster0
   ```
5. **Replace `<password>`** with: `olH07V3q5RDbij9n`
6. **Add database name** before the `?`: `/comet-portal`
7. **Final format should be**:
   ```
   mongodb+srv://aqstoria_db_user:olH07V3q5RDbij9n@clustero.iehlnqe.mongodb.net/comet-portal?retryWrites=true&w=majority
   ```

## Solution 2: Try Without appName

Update `.env.local` with this simplified version:

```env
MONGODB_URI=mongodb+srv://aqstoria_db_user:olH07V3q5RDbij9n@clustero.iehlnqe.mongodb.net/comet-portal?retryWrites=true&w=majority
```

## Solution 3: Check Network Access

1. Go to MongoDB Atlas → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for testing)
   - Or add your current IP: `182.190.154.206`
4. **Wait 1-2 minutes** for changes to apply

## Solution 4: Verify Cluster Status

1. Check MongoDB Atlas dashboard
2. Ensure cluster is **running** (not paused)
3. Verify cluster name matches: `Cluster0`

## After Making Changes

1. **Restart the server**:
   - Stop: Press `Ctrl+C` in terminal
   - Start: `npm run dev`

2. **Test connection**: Visit http://localhost:3000/api/test

## Still Not Working?

The cluster hostname might be different. Check MongoDB Atlas for the exact connection string.

