import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

/**
 * Lightweight endpoint that returns only names for @mention autocomplete.
 * Available to all authenticated users (no admin permission needed).
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const users = await User.find().select('name').lean();
    const names = users
      .map((u: any) => u.name as string)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ success: true, data: names });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
