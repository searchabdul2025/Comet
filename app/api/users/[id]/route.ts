import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';

// GET single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both async and sync params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;

    await connectDB();
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Admin can update users
    const { requirePermission } = await import('@/lib/permissions');
    if (!requirePermission(currentUser.role as any, 'canManageUsers')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Handle both async and sync params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;

    await connectDB();
    const body = await request.json();

    if (!body.username && !body.email) {
      return NextResponse.json(
        { success: false, error: 'Username or email is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name: body.name,
      email: body.email ? body.email.toLowerCase().trim() : undefined,
      username: body.username ? body.username.toLowerCase().trim() : undefined,
      role: body.role,
      permissions: body.permissions,
    };

    // If password is being updated, hash it
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Admin can delete users
    const { requirePermission } = await import('@/lib/permissions');
    if (!requirePermission(currentUser.role as any, 'canManageUsers')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Handle both async and sync params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;

    await connectDB();
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

