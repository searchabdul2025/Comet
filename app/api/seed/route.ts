import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// Seed initial users for testing
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Get admin credentials from environment variables or use defaults
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cometportal.com';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Get supervisor credentials from environment variables or use defaults
    const supervisorName = process.env.SUPERVISOR_NAME || 'Supervisor User';
    const supervisorEmail = process.env.SUPERVISOR_EMAIL || 'supervisor@cometportal.com';
    const supervisorUsername = process.env.SUPERVISOR_USERNAME || 'supervisor';
    const supervisorPassword = process.env.SUPERVISOR_PASSWORD || 'supervisor123';

    // Get user credentials from environment variables or use defaults
    const userName = process.env.USER_NAME || 'Regular User';
    const userEmail = process.env.USER_EMAIL || 'user@cometportal.com';
    const userUsername = process.env.USER_USERNAME || 'user';
    const userPassword = process.env.USER_PASSWORD || 'user123';

    // Default users to create
    const defaultUsers = [
      {
        name: adminName,
        email: adminEmail,
        username: adminUsername,
        password: await bcrypt.hash(adminPassword, 10),
        role: 'Admin',
        permissions: {
          canManageUsers: true,
          canManageForms: true,
          canManageIPs: true,
          canViewSubmissions: true,
          canManageRequests: true,
          canDeleteForms: true,
          canEditForms: true,
          canCreateForms: true,
          canManageSettings: true,
          canDeleteSubmissions: true,
        },
      },
      {
        name: supervisorName,
        email: supervisorEmail,
        username: supervisorUsername,
        password: await bcrypt.hash(supervisorPassword, 10),
        role: 'Supervisor',
      },
      {
        name: userName,
        email: userEmail,
        username: userUsername,
        password: await bcrypt.hash(userPassword, 10),
        role: 'User',
      },
    ];

    const createdUsers = [];
    const existingUsers = [];

    for (const userData of defaultUsers) {
      // Check by email or username
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });
      
      if (existingUser) {
        if (force) {
          // Update existing user with new password and data
          existingUser.password = userData.password;
          existingUser.role = userData.role;
          existingUser.name = userData.name;
          existingUser.email = userData.email;
          existingUser.username = userData.username;
          if (userData.permissions) {
            existingUser.permissions = userData.permissions;
          }
          await existingUser.save();
          createdUsers.push(existingUser);
        } else {
          existingUsers.push(userData.email || userData.username);
        }
      } else {
        // Create new user
        const newUser = await User.create(userData);
        createdUsers.push(newUser);
      }
    }

    if (createdUsers.length === 0 && existingUsers.length > 0 && !force) {
      return NextResponse.json({
        success: true,
        message: 'Users already exist. Use ?force=true to update them.',
        existingUsers: existingUsers,
      });
    }

    return NextResponse.json({
      success: true,
      message: force ? 'Users updated/created successfully' : 'Seed data created successfully',
      data: {
        usersCreated: createdUsers.length,
        users: createdUsers.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          username: u.username,
          role: u.role,
        })),
        existingUsers: existingUsers,
        credentials: {
          admin: {
            username: adminUsername,
            email: adminEmail,
            password: adminPassword,
          },
          supervisor: {
            username: supervisorUsername,
            email: supervisorEmail,
            password: supervisorPassword,
          },
          user: {
            username: userUsername,
            email: userEmail,
            password: userPassword,
          },
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

