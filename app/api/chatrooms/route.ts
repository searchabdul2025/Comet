import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ChatRoom from '@/models/ChatRoom';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
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

    // Only admins can list chatrooms
    const canManage = requirePermission(
      dbUser.role as any,
      'canManageChatRooms',
      dbUser.permissions as any
    );

    if (!canManage) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const query: any = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    const chatrooms = await ChatRoom.find(query)
      .populate('createdBy', 'name email username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: chatrooms.map((cr: any) => ({
        _id: cr._id.toString(),
        name: cr.name,
        description: cr.description,
        createdBy: cr.createdBy,
        isActive: cr.isActive,
        maxParticipants: cr.maxParticipants,
        createdAt: cr.createdAt,
        updatedAt: cr.updatedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch chatrooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, maxParticipants } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Chatroom name is required' }, { status: 400 });
    }

    const chatroom = await ChatRoom.create({
      name: name.trim(),
      description: description?.trim() || undefined,
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      createdBy: dbUser._id,
      isActive: true,
    });

    const populated = await ChatRoom.findById(chatroom._id)
      .populate('createdBy', 'name email username')
      .lean() as any;

    return NextResponse.json({
      success: true,
      data: {
        _id: populated._id.toString(),
        name: populated.name,
        description: populated.description,
        createdBy: populated.createdBy,
        isActive: populated.isActive,
        maxParticipants: populated.maxParticipants,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Chatroom name already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to create chatroom' }, { status: 500 });
  }
}

