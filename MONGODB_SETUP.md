# MongoDB Setup Guide

## Why MongoDB?

MongoDB is perfect for this form builder application because:

✅ **Dynamic Schemas** - Forms have different fields, MongoDB handles this naturally  
✅ **Flexible Data** - Form submissions vary by form structure  
✅ **Easy to Scale** - Great for growing applications  
✅ **JSON-like Documents** - Matches JavaScript/TypeScript data structures  

## Quick Setup Options

### 🚀 Option 1: MongoDB Atlas (Cloud - Easiest)

**Best for**: Quick start, production, team collaboration

1. **Sign up** at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (Free tier available)
2. **Create a Cluster**:
   - Choose "Free" tier (M0)
   - Select your preferred region
   - Click "Create Cluster"
3. **Set up Database Access**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"
4. **Set up Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP for production
5. **Get Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/comet-portal?retryWrites=true&w=majority`

6. **Update `.env.local`**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/comet-portal?retryWrites=true&w=majority
```

### 💻 Option 2: Local MongoDB

**Best for**: Development, offline work, full control

#### Windows:

1. **Download** [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. **Install** with default settings (includes MongoDB Compass GUI)
3. **Verify Installation**:
   - MongoDB should start automatically as a Windows service
   - Or start manually: Open Services → Find "MongoDB" → Start
4. **Connection String**:
```env
MONGODB_URI=mongodb://localhost:27017/comet-portal
```

#### macOS:

```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Connection string
MONGODB_URI=mongodb://localhost:27017/comet-portal
```

#### Linux (Ubuntu/Debian):

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Connection string
MONGODB_URI=mongodb://localhost:27017/comet-portal
```

## Verify Connection

After setting up, test your connection:

1. Start your Next.js app: `npm run dev`
2. Check the console for: `✅ MongoDB Connected`
3. If you see an error, check:
   - MongoDB is running (for local)
   - Connection string is correct
   - Network access is allowed (for Atlas)
   - Credentials are correct

## Database Structure

The application will automatically create these collections:

- `users` - User accounts
- `forms` - Form definitions
- `formsubmissions` - Form submissions
- `ipaddresses` - Authorized IPs
- `requests` - User requests

## Troubleshooting

### Connection Refused (Local)
- Make sure MongoDB service is running
- Check if port 27017 is available
- Verify MongoDB is installed correctly

### Authentication Failed (Atlas)
- Double-check username and password
- Ensure password doesn't contain special characters that need URL encoding
- Verify database user has correct permissions

### Network Timeout (Atlas)
- Check Network Access settings in Atlas
- Ensure your IP is whitelisted
- Try "Allow Access from Anywhere" for testing

### Connection String Format
Make sure your connection string includes:
- Protocol: `mongodb://` or `mongodb+srv://`
- Credentials: `username:password@`
- Host: `cluster.xxxxx.mongodb.net` or `localhost:27017`
- Database name: `/comet-portal`
- Options: `?retryWrites=true&w=majority` (for Atlas)

## Next Steps

Once MongoDB is connected:
1. ✅ Database models are ready
2. ✅ API routes can save/retrieve data
3. 🔄 Connect frontend to API routes
4. 🔄 Add authentication
5. 🔄 Seed initial data (optional)

## Useful Tools

- **MongoDB Compass** - GUI for viewing/editing data (comes with local install)
- **MongoDB Atlas UI** - Web interface for cloud database
- **VS Code Extension** - MongoDB for VS Code (optional)

