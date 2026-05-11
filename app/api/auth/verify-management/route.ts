import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser || (sessionUser.role !== 'Admin' && sessionUser.role !== 'Supervisor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(sessionUser.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid management password.' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
