import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ChatRoom from '@/models/ChatRoom';
import ChatRoomCredential from '@/models/ChatRoomCredential';
import { requirePermission } from '@/lib/permissions';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return params instanceof Promise ? await params : params;
}

// GET: List credentials for a chatroom
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const User = (await import('@/models/User')).default;
    const dbUser = await User.findOne({ email: user.email }).lean() as any;

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const canManage = requirePermission(
      dbUser.role as any,
      'canManageChatRooms',
      dbUser.permissions as any
    );

    if (!canManage) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await resolveParams(params);

    // Verify chatroom exists
    const chatroom = await ChatRoom.findById(id).lean();
    if (!chatroom) {
      return NextResponse.json({ success: false, error: 'Chatroom not found' }, { status: 404 });
    }

    const credentials = await ChatRoomCredential.find({ chatRoom: id })
      .populate('createdBy', 'name email username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: credentials.map((cred: any) => ({
        _id: cred._id.toString(),
        username: cred.username,
        displayName: cred.displayName,
        isActive: cred.isActive,
        lastUsedAt: cred.lastUsedAt,
        createdBy: cred.createdBy,
        createdAt: cred.createdAt,
        updatedAt: cred.updatedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch credentials' }, { status: 500 });
  }
}

// POST: Create new credentials for a chatroom
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const User = (await import('@/models/User')).default;
    const dbUser = await User.findOne({ email: user.email }).lean() as any;

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const canManage = requirePermission(
      dbUser.role as any,
      'canManageChatRooms',
      dbUser.permissions as any
    );

    if (!canManage) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await resolveParams(params);
    const body = await request.json();
    const { username, password, displayName, useAccountCredentials, userId } = body;

    // Verify chatroom exists
    const chatroom = await ChatRoom.findById(id).lean();
    if (!chatroom) {
      return NextResponse.json({ success: false, error: 'Chatroom not found' }, { status: 404 });
    }

    let finalUsername = '';
    let finalPassword = '';
    let linkedUserId = undefined;

    if (useAccountCredentials && userId) {
      // Use supervisor's account credentials
      const targetUser = await User.findById(userId).lean() as any;
      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      if (targetUser.role !== 'Supervisor') {
        return NextResponse.json({ success: false, error: 'Only supervisors can use account credentials' }, { status: 400 });
      }
      finalUsername = (targetUser.username || targetUser.email || '').toLowerCase().trim();
      if (!finalUsername) {
        return NextResponse.json({ success: false, error: 'User must have username or email' }, { status: 400 });
      }
      // Store a reference to the user account - password will be checked against user account during login
      linkedUserId = targetUser._id;
      // Use a placeholder password - actual password check will be against user account
      finalPassword = 'ACCOUNT_CREDENTIAL_LINKED';
    } else {
      // Custom credentials
      if (!username || !username.trim()) {
        return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
      }
      if (!password || password.length < 4) {
        return NextResponse.json({ success: false, error: 'Password must be at least 4 characters' }, { status: 400 });
      }
      finalUsername = username.trim().toLowerCase();
      finalPassword = password;
    }

    // Check if username already exists for this chatroom
    const existingCred = await ChatRoomCredential.findOne({
      chatRoom: id,
      username: finalUsername,
    }).lean();
    if (existingCred) {
      return NextResponse.json({ success: false, error: 'Username already exists for this chatroom' }, { status: 409 });
    }

    const credential = await ChatRoomCredential.create({
      chatRoom: id,
      username: finalUsername,
      password: finalPassword, // Will be hashed by pre-save hook (or stored as special marker)
      displayName: displayName?.trim() || undefined,
      createdBy: dbUser._id,
      isActive: true,
      linkedUserId: linkedUserId, // Store reference to user account if using account credentials
    });

    const populated = await ChatRoomCredential.findById(credential._id)
      .populate('createdBy', 'name email username')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        _id: (populated as any)._id.toString(),
        username: (populated as any).username,
        displayName: (populated as any).displayName,
        isActive: (populated as any).isActive,
        createdBy: (populated as any).createdBy,
        createdAt: (populated as any).createdAt,
      },
      // Return plain password only on creation (for admin to share)
      plainPassword: password,
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Username already exists for this chatroom' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to create credential' }, { status: 500 });
  }
}

