import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import ChatRoomCredential from '@/models/ChatRoomCredential';
import { addClient, removeClient } from '@/lib/chatStream';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return params instanceof Promise ? await params : params;
}

// Helper to get chatroom session from cookie
async function getChatroomSession(request: NextRequest) {
  const token = request.cookies.get('chatroom_token')?.value;
  if (!token) return null;

  try {
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());
    return sessionData;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await resolveParams(params);
  const session = await getChatroomSession(request);

  if (!session || session.chatroomId !== id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Verify session is still valid
  try {
    await connectDB();
    const chatroom = await ChatRoom.findById(id).lean();
    if (!chatroom || !(chatroom as any).isActive) {
      return NextResponse.json({ success: false, error: 'Chatroom not found or inactive' }, { status: 404 });
    }

    const credential = await ChatRoomCredential.findById(session.credentialId).lean();
    if (!credential || !(credential as any).isActive) {
      return NextResponse.json({ success: false, error: 'Credential not found or inactive' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Add client with specific chatroomId
      const clientId = addClient(controller, id);

      const send = (message: string) => {
        controller.enqueue(new TextEncoder().encode(message));
      };

      send(`data: ${JSON.stringify({ type: 'system', message: 'connected' })}\n\n`);

      const heartbeat = setInterval(() => {
        send(':ping\n\n');
      }, 20000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        removeClient(clientId);
        controller.close();
      });
    },
    cancel() {
      // handled by abort listener
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

