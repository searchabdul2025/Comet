type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  chatroomId?: string | null; // null for main team chat, string for specific chatroom
};

export type ChatEvent =
  | { type: 'message'; message: any }
  | { type: 'ban'; ban: { userId: string; reason?: string | null } }
  | { type: 'unban'; userId: string }
  | { type: 'system'; message: string };

const encoder = new TextEncoder();
const globalAny = global as any;
const clients: SSEClient[] = globalAny.__chatClients || [];

if (!globalAny.__chatClients) {
  globalAny.__chatClients = clients;
}

export function addClient(controller: ReadableStreamDefaultController<Uint8Array>, chatroomId?: string | null) {
  const id = crypto.randomUUID();
  clients.push({ id, controller, chatroomId: chatroomId ?? null });
  return id;
}

export function removeClient(id: string) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx >= 0) {
    clients.splice(idx, 1);
  }
}

export function broadcast(event: ChatEvent) {
  // Broadcast to main team chat (chatroomId is null)
  const payload = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  clients.forEach((client) => {
    if (client.chatroomId === null || client.chatroomId === undefined) {
      try {
        client.controller.enqueue(payload);
      } catch (err) {
        removeClient(client.id);
      }
    }
  });
}

export function broadcastToChatroom(chatroomId: string, event: ChatEvent) {
  // Broadcast to specific chatroom
  const payload = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  clients.forEach((client) => {
    if (client.chatroomId === chatroomId) {
      try {
        client.controller.enqueue(payload);
      } catch (err) {
        removeClient(client.id);
      }
    }
  });
}











