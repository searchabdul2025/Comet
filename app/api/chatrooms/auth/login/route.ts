import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import ChatRoomCredential from '@/models/ChatRoomCredential';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatroomId, username, password } = body;

    if (!chatroomId || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Chatroom ID, username, and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify chatroom exists and is active
    const chatroom = await ChatRoom.findById(chatroomId).lean();
    if (!chatroom) {
      return NextResponse.json({ success: false, error: 'Chatroom not found' }, { status: 404 });
    }

    if (!(chatroom as any).isActive) {
      return NextResponse.json({ success: false, error: 'Chatroom is not active' }, { status: 403 });
    }

    // Find credential
    const credential = await ChatRoomCredential.findOne({
      chatRoom: chatroomId,
      username: username.trim().toLowerCase(),
      isActive: true,
    }).populate('linkedUserId');

    if (!credential) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    let isValid = false;
    const cred = credential as any;
    
    if (cred.linkedUserId) {
      // This credential is linked to a user account - verify against user's password
      const linkedUser = await User.findById(cred.linkedUserId).lean() as any;
      if (linkedUser) {
        isValid = await bcrypt.compare(password, linkedUser.password);
      }
    } else {
      // Regular credential - verify against credential password
      isValid = await cred.comparePassword(password);
    }
    
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last used
    credential.lastUsedAt = new Date();
    await credential.save();

    // Return session token (we'll use JWT or simple token)
    // For now, we'll return the credential ID and chatroom ID
    // In production, use proper JWT tokens
    const sessionData = {
      chatroomId: chatroomId,
      credentialId: credential._id.toString(),
      username: credential.username,
      displayName: credential.displayName || credential.username,
      chatroomName: (chatroom as any).name,
    };

    // Create a simple token (in production, use JWT)
    const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // Set cookie
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        chatroom: {
          _id: chatroomId,
          name: (chatroom as any).name,
          description: (chatroom as any).description,
        },
        user: {
          username: credential.username,
          displayName: credential.displayName || credential.username,
        },
      },
    });

    // Set HTTP-only cookie for security
    response.cookies.set('chatroom_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Login failed' }, { status: 500 });
  }
}

