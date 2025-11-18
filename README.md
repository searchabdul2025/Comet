# Comet Portal

A modern form builder and management portal built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Authentication System** - Role-based login with quick fill options (Admin, Supervisor, User)
- 📊 **Admin Dashboard** - Overview with metrics cards and quick actions
- 📝 **Form Builder** - Dynamic form creation with multiple field types and validation
- 📋 **Form Management** - View, preview, and manage all forms
- 👥 **User Management** - Add, edit, delete users and manage roles
- 🌐 **IP Management** - Manage authorized IP addresses
- 🔔 **Requests** - Handle user requests and approvals

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Password Hashing**: bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- MongoDB installed locally OR MongoDB Atlas account (free tier available)

### Installation

1. Navigate to the project directory:
```bash
cd comet-portal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
# Copy the template: cp env.template .env.local
# Or create manually and add the following variables:
```

**Required Environment Variables:**
```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/comet-portal?retryWrites=true&w=majority

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters

# NextAuth URL (for local: http://localhost:3000)
NEXTAUTH_URL=http://localhost:3000
```

See `ENVIRONMENT_VARIABLES.md` for detailed setup instructions.

4. Start MongoDB (if using local installation):
```bash
# Windows (if installed as service, it should start automatically)
# Or download MongoDB Community Server from https://www.mongodb.com/try/download/community

# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
comet-portal/
├── app/
│   ├── api/                # API routes (Next.js API routes)
│   │   ├── forms/          # Form CRUD operations
│   │   └── users/          # User CRUD operations
│   ├── dashboard/          # Admin dashboard
│   ├── forms/              # Forms listing and preview
│   ├── form-builder/       # Dynamic form builder
│   ├── user-management/    # User management page
│   ├── ip-management/      # IP management page
│   ├── requests/           # Requests management
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Login page
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── Header.tsx          # Top header with user info
├── lib/
│   └── mongodb.ts          # MongoDB connection utility
├── models/                 # Mongoose models
│   ├── User.ts            # User model
│   ├── Form.ts            # Form model
│   ├── FormSubmission.ts  # Form submission model
│   ├── IPAddress.ts       # IP address model
│   └── Request.ts         # Request model
└── public/                 # Static assets
```

## Default Login Credentials

The application includes quick fill buttons for testing:

- **Admin**: admin@cometportal.com / admin123
- **Supervisor**: supervisor@cometportal.com / supervisor123
- **User**: user@cometportal.com / user123

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features Overview

### Form Builder
- Create forms with multiple field types (text, email, phone, number, date, select, radio, checkbox, textarea)
- Add validation rules
- Mark fields as required
- Configure options for select and radio fields

### User Management
- View all users in a table
- Add new users with role assignment
- Edit existing users
- Delete users
- Reset user passwords

### IP Management
- Add authorized IP addresses
- View IP status (Active/Inactive)
- Edit and delete IP addresses

## Database Models

The application uses MongoDB with the following models:

- **User**: Stores user accounts with roles (Admin, Supervisor, User)
- **Form**: Stores form definitions with dynamic field configurations
- **FormSubmission**: Stores form submissions with dynamic data matching form structure
- **IPAddress**: Stores authorized IP addresses
- **Request**: Stores user requests (IP authorization, etc.)

## MongoDB Setup Options

### Option 1: Local MongoDB
1. Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/comet-portal`

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)
1. Sign up for free at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Get your connection string
4. Update `.env.local` with your Atlas connection string

## API Routes

The application includes Next.js API routes:

- `GET /api/forms` - Get all forms
- `POST /api/forms` - Create a new form
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

## Next Steps

To make this production-ready, consider:

1. ✅ **Database**: MongoDB is set up with Mongoose models
2. **Authentication**: Implement proper JWT or session-based auth (NextAuth.js recommended)
3. **API Integration**: Connect frontend components to API routes
4. **Form Storage**: Forms can now be saved to MongoDB
5. **Form Submissions**: Submission storage is ready
6. **Validation**: Add server-side validation in API routes
7. **Error Handling**: Implement comprehensive error handling
8. **Testing**: Add unit and integration tests
9. **Environment Variables**: Set up proper environment variables for production

## Deployment to Vercel

This project is ready to deploy to Vercel. Follow these steps:

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with your GitHub account
2. Click "New Project"
3. Import your GitHub repository: `Ahmadkhanworkspace/portal`
4. Configure environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `NEXTAUTH_SECRET` - A random secret string (generate with: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://portal-blue-zeta.vercel.app`)
5. Click "Deploy"

### 3. Environment Variables in Vercel

After deployment, go to your project settings → Environment Variables and add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/comet-portal
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://portal-blue-zeta.vercel.app
```

### 4. Seed Initial Users

After deployment, visit:
```
https://portal-blue-zeta.vercel.app/api/seed?force=true
```

This will create the default admin, supervisor, and user accounts.

### 5. Access Your App

Your app is live at: **https://portal-blue-zeta.vercel.app**

## License

© 2025 Comet Portal •
