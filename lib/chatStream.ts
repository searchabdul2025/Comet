type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
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

export function addClient(controller: ReadableStreamDefaultController<Uint8Array>) {
  const id = crypto.randomUUID();
  clients.push({ id, controller });
  return id;
}

export function removeClient(id: string) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx >= 0) {
    clients.splice(idx, 1);
  }
}

export function broadcast(event: ChatEvent) {
  const payload = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  clients.forEach((client) => {
    try {
      client.controller.enqueue(payload);
    } catch (err) {
      // Drop the broken client; stream likely closed
      removeClient(client.id);
    }
  });
}








