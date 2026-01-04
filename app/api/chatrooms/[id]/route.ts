import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ChatRoom from '@/models/ChatRoom';
import { requirePermission } from '@/lib/permissions';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return params instanceof Promise ? await params : params;
}

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
    const { id } = await resolveParams(params);

    const chatroom = await ChatRoom.findById(id)
      .populate('createdBy', 'name email username')
      .lean();

    if (!chatroom) {
      return NextResponse.json({ success: false, error: 'Chatroom not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: (chatroom as any)._id.toString(),
        name: (chatroom as any).name,
        description: (chatroom as any).description,
        createdBy: (chatroom as any).createdBy,
        isActive: (chatroom as any).isActive,
        maxParticipants: (chatroom as any).maxParticipants,
        visibility: (chatroom as any).visibility,
        allowedRoles: (chatroom as any).allowedRoles,
        allowedUsers: (chatroom as any).allowedUsers,
        showInSidebar: (chatroom as any).showInSidebar,
        requireApproval: (chatroom as any).requireApproval,
        createdAt: (chatroom as any).createdAt,
        updatedAt: (chatroom as any).updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch chatroom' }, { status: 500 });
  }
}

export async function PUT(
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
    const { name, description, isActive, maxParticipants, visibility, allowedRoles, allowedUsers, showInSidebar, requireApproval } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || undefined;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants ? Number(maxParticipants) : undefined;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (allowedRoles !== undefined) updateData.allowedRoles = allowedRoles || [];
    if (allowedUsers !== undefined) updateData.allowedUsers = allowedUsers || [];
    if (showInSidebar !== undefined) updateData.showInSidebar = Boolean(showInSidebar);
    if (requireApproval !== undefined) updateData.requireApproval = Boolean(requireApproval);

    const chatroom = await ChatRoom.findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'name email username')
      .lean();

    if (!chatroom) {
      return NextResponse.json({ success: false, error: 'Chatroom not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: (chatroom as any)._id.toString(),
        name: (chatroom as any).name,
        description: (chatroom as any).description,
        createdBy: (chatroom as any).createdBy,
        isActive: (chatroom as any).isActive,
        maxParticipants: (chatroom as any).maxParticipants,
        visibility: (chatroom as any).visibility,
        allowedRoles: (chatroom as any).allowedRoles,
        allowedUsers: (chatroom as any).allowedUsers,
        showInSidebar: (chatroom as any).showInSidebar,
        requireApproval: (chatroom as any).requireApproval,
        createdAt: (chatroom as any).createdAt,
        updatedAt: (chatroom as any).updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update chatroom' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Soft delete by setting isActive to false
    const chatroom = await ChatRoom.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();

    if (!chatroom) {
      return NextResponse.json({ success: false, error: 'Chatroom not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Chatroom deactivated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete chatroom' }, { status: 500 });
  }
}

