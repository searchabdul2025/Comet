import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ChatRoom from '@/models/ChatRoom';
import ChatRoomCredential from '@/models/ChatRoomCredential';
import User from '@/models/User';
import { requirePermission } from '@/lib/permissions';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get user from database
    const dbUser = await User.findOne({ email: user.email }).lean() as any;
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if user has canManageChatRooms permission
    const canManageChatRooms = requirePermission(
      dbUser.role as any,
      'canManageChatRooms',
      dbUser.permissions as any
    );

    if (!canManageChatRooms) {
      // User doesn't have permission - return empty list
      return NextResponse.json({ success: true, data: [] });
    }

    const userRole = dbUser.role as 'Admin' | 'Supervisor' | 'User';
    const userId = dbUser._id;

    // Find all active chatrooms
    const allChatrooms = await ChatRoom.find({ isActive: true, showInSidebar: true })
      .populate('createdBy', 'name email username')
      .lean() as any[];

    // Filter chatrooms based on visibility and access
    const accessibleChatrooms = allChatrooms.filter((chatroom: any) => {
      // Admin can always access
      if (userRole === 'Admin') {
        return true;
      }

      // Check visibility
      if (chatroom.visibility === 'public') {
        // If allowedRoles is specified, check if user's role is allowed
        if (chatroom.allowedRoles && chatroom.allowedRoles.length > 0) {
          return chatroom.allowedRoles.includes(userRole);
        }
        // If no allowedRoles, all authenticated users can access
        return true;
      }

      if (chatroom.visibility === 'invite-only') {
        // Check if user has credentials for this chatroom
        // We'll check this separately
        return true; // We'll filter by credentials below
      }

      // private - only accessible via credentials (handled below)
      return false;
    });

    // For invite-only and private, check if user has credentials
    const credentialCheckPromises = accessibleChatrooms.map(async (chatroom: any) => {
      if (chatroom.visibility === 'invite-only' || chatroom.visibility === 'private') {
        // Check if user has credentials for this chatroom
        const credential = await ChatRoomCredential.findOne({
          chatRoom: chatroom._id,
          isActive: true,
        }).lean() as any;

        // Also check if user is in allowedUsers or allowedRoles
        const isInAllowedUsers = chatroom.allowedUsers?.some((id: any) => id.toString() === userId.toString());
        const isInAllowedRoles = chatroom.allowedRoles?.includes(userRole);

        // For invite-only, user needs credentials OR be in allowedUsers/allowedRoles
        // For private, user needs credentials
        if (chatroom.visibility === 'private') {
          return !!credential || isInAllowedUsers || isInAllowedRoles;
        }

        // For invite-only
        return !!credential || isInAllowedUsers || isInAllowedRoles;
      }

      return true;
    });

    const credentialChecks = await Promise.all(credentialCheckPromises);
    const finalChatrooms = accessibleChatrooms.filter((_, index) => credentialChecks[index]);

    return NextResponse.json({
      success: true,
      data: finalChatrooms.map((cr: any) => ({
        _id: cr._id.toString(),
        name: cr.name,
        description: cr.description,
        visibility: cr.visibility,
        createdAt: cr.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch accessible chatrooms' }, { status: 500 });
  }
}

