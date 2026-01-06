import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ChatRoom from '@/models/ChatRoom';
import ChatMessage from '@/models/ChatMessage';
import ChatRoomCredential from '@/models/ChatRoomCredential';
import User from '@/models/User';
import { requirePermission } from '@/lib/permissions';
import mongoose from 'mongoose';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return params instanceof Promise ? await params : params;
}

// DELETE: Delete all messages in a chatroom (admin only)
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
    const UserModel = (await import('@/models/User')).default;
    const dbUser = await UserModel.findOne({ email: user.email }).lean() as any;

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin or has canManageChatRooms permission
    const isAdmin = dbUser.role === 'Admin';
    const canManage = requirePermission(
      dbUser.role as any,
      'canManageChatRooms',
      dbUser.permissions as any
    );

    if (!isAdmin && !canManage) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await resolveParams(params);
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action'); // 'delete-messages', 'delete-chat', 'ban-user'

    if (action === 'delete-messages') {
      // Delete all messages in the chatroom
      const result = await ChatMessage.deleteMany({ chatroomId: id });
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${result.deletedCount} messages`,
        deletedCount: result.deletedCount 
      });
    } else if (action === 'delete-chat') {
      // Delete the entire chatroom (soft delete)
      const chatroom = await ChatRoom.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!chatroom) {
        return NextResponse.json({ success: false, error: 'Chatroom not found' }, { status: 404 });
      }
      
      // Also delete all messages
      await ChatMessage.deleteMany({ chatroomId: id });
      
      // Deactivate all credentials
      await ChatRoomCredential.updateMany({ chatRoom: id }, { isActive: false });
      
      return NextResponse.json({ success: true, message: 'Chatroom deleted successfully' });
    } else if (action === 'ban-user') {
      // Ban a user from the chatroom
      const body = await request.json();
      const { userId, reason } = body;
      
      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
      }

      // Find the credential for this user in this chatroom
      const credential = await ChatRoomCredential.findOne({
        chatRoom: id,
        linkedUserId: userId,
        isActive: true,
      });

      if (credential) {
        // Deactivate the credential (effectively banning them)
        credential.isActive = false;
        await credential.save();
      }

      // Also delete all messages from this user in this chatroom
      await ChatMessage.deleteMany({ 
        chatroomId: id,
        userId: userId,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'User banned from chatroom',
        reason: reason || 'No reason provided'
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Chatroom admin action error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to perform action' }, { status: 500 });
  }
}

// POST: Delete a specific message (admin only)
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
    const UserModel = (await import('@/models/User')).default;
    const dbUser = await UserModel.findOne({ email: user.email }).lean() as any;

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin or has canManageChatRooms permission
    const isAdmin = dbUser.role === 'Admin';
    const canManage = requirePermission(
      dbUser.role as any,
      'canManageChatRooms',
      dbUser.permissions as any
    );

    if (!isAdmin && !canManage) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await resolveParams(params);
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ success: false, error: 'Message ID is required' }, { status: 400 });
    }

    // Verify message belongs to this chatroom
    const message = await ChatMessage.findOne({ _id: messageId, chatroomId: id });
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    // Delete the message
    await ChatMessage.findByIdAndDelete(messageId);

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Delete message error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete message' }, { status: 500 });
  }
}

