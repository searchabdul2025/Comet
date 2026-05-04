# MongoDB Atlas Connection Setup

## Your Connection Details

Based on your MongoDB Atlas setup:

- **Username**: `aqstoria_db_user`
- **Password**: `olH07V3q5RDbij9n`
- **Cluster**: `clustero.iehlnqe.mongodb.net`
- **Database Name**: `comet-portal` (we'll add this)

## Step 1: Create .env.local File

Create a file named `.env.local` in the `comet-portal` directory with the following content:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://aqstoria_db_user:olH07V3q5RDbij9n@clustero.iehlnqe.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret (for authentication - generate a random string)
JWT_SECRET=your-secret-key-change-this-in-production

# NextAuth URL (if using NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production
```

## Step 2: Verify Connection

1. Make sure your `.env.local` file is in the `comet-portal` directory
2. Start the development server:
   ```bash
   cd comet-portal
   npm run dev
   ```
3. Check the console - you should see: `✅ MongoDB Connected`

## Important Notes

⚠️ **Security**: 
- Never commit `.env.local` to git (it's already in .gitignore)
- The password shown here is from your setup - keep it secure
- For production, use environment variables on your hosting platform

✅ **Connection String Format**:
- The connection string includes the database name `/comet-portal`
- It includes connection options for reliability
- The `appName=Cluster0` parameter is included

## Troubleshooting

If you see connection errors:

1. **Check IP Whitelist**: Make sure your IP (182.190.154.206) is still whitelisted in MongoDB Atlas Network Access
2. **Verify Password**: Ensure the password in the connection string matches exactly
3. **Check Database Name**: The database `comet-portal` will be created automatically on first use
4. **Network Issues**: If using a VPN, you may need to whitelist the VPN IP

## Next Steps

Once connected:
1. ✅ Database models are ready
2. ✅ API routes can save/retrieve data
3. 🔄 Test the connection by creating a user or form
4. 🔄 Connect frontend to API routes

