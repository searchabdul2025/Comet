# MongoDB Connection Troubleshooting

## Error: "querySrv ENOTFOUND _mongodb._tcp.clustero.iehlnqe.mongodb.net"

This error indicates a DNS resolution issue. Here are solutions:

### Solution 1: Verify Connection String Format

Make sure your connection string in `.env.local` is exactly:

```env
MONGODB_URI=mongodb+srv://aqstoria_db_user:olH07V3q5RDbij9n@clustero.iehlnqe.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0
```

### Solution 2: Get Fresh Connection String from MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password: `olH07V3q5RDbij9n`
6. Add database name: `/comet-portal` before the `?`
7. Update `.env.local` with the new string

### Solution 3: Check Network Access

1. Go to MongoDB Atlas → Network Access
2. Make sure your IP address is whitelisted
3. Or temporarily allow "0.0.0.0/0" (all IPs) for testing
4. Wait 1-2 minutes for changes to propagate

### Solution 4: Verify Cluster Name

The cluster name in the connection string should match your actual cluster:
- Check MongoDB Atlas dashboard
- Verify the cluster name is `Cluster0` or matches your cluster
- The hostname should be: `clustero.iehlnqe.mongodb.net`

### Solution 5: Test Connection String

Try this connection string format (without appName):

```env
MONGODB_URI=mongodb+srv://aqstoria_db_user:olH07V3q5RDbij9n@clustero.iehlnqe.mongodb.net/comet-portal?retryWrites=true&w=majority
```

### Solution 6: Use Standard Connection (if SRV fails)

If `mongodb+srv://` doesn't work, try the standard format:

1. In MongoDB Atlas, click "Connect"
2. Choose "Connect using MongoDB Compass"
3. Copy the standard connection string (starts with `mongodb://`)
4. Update `.env.local`

### Solution 7: Check DNS/Network

- Ensure you have internet connectivity
- Try pinging: `ping clustero.iehlnqe.mongodb.net`
- Check if firewall is blocking MongoDB ports
- Try from a different network

### Solution 8: Verify Credentials

1. Go to MongoDB Atlas → Database Access
2. Verify user `aqstoria_db_user` exists
3. Check password is correct: `olH07V3q5RDbij9n`
4. Ensure user has proper permissions

### Quick Test

After updating `.env.local`, restart the Next.js server:
1. Stop the server (Ctrl+C)
2. Start again: `npm run dev`
3. Visit: http://localhost:3000/api/test

### Still Not Working?

1. **Check MongoDB Atlas Status**: Ensure cluster is running
2. **Verify Cluster Region**: Make sure it's accessible
3. **Try Different Network**: Test from mobile hotspot
4. **Contact Support**: MongoDB Atlas support if cluster issue

## Common Connection String Formats

**SRV Format (Recommended):**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Standard Format:**
```
mongodb://username:password@cluster-shard-00-00.xxxxx.mongodb.net:27017/database?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

