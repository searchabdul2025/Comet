import { NextRequest, NextResponse } from 'next/server';
import { addClient, broadcast, removeClient } from '@/lib/chatStream';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Main team chat has chatroomId = null
      const clientId = addClient(controller, null);

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

// Allow other routes to send a system event without importing stream logic directly
export function pushSystemMessage(message: string) {
  broadcast({ type: 'system', message });
}











