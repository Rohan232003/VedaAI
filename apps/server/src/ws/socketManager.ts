import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import type { WSMessage } from '@vedaai/shared';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function setupWebSocket(server: http.Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 WebSocket client connected');
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      data: { message: 'Connected to VedaAI WebSocket' },
    }));

    ws.on('close', () => {
      clients.delete(ws);
      console.log('🔌 WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      clients.delete(ws);
    });

    // Handle incoming messages (e.g., subscribe to specific assignment)
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        console.log('📩 WS message received:', msg);
      } catch {
        // Ignore invalid messages
      }
    });
  });
}

export function broadcastMessage(message: WSMessage | Record<string, unknown>): void {
  const payload = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
