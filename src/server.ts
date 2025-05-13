import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const server = http.createServer();
const wss = new WebSocketServer({ server });

const users = new Map<string, WebSocket>();

wss.on('connection', (ws) => {
  console.log('new client connected');

  let currentUserId: string | null = null;

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      if (parsed.type === 'login') {
        currentUserId = parsed.userId;
        users.set(currentUserId!, ws);
        console.log(`User ${currentUserId} logged in`);
        return;
      }

      if (parsed.type === 'message') {
        const toSocket = users.get(parsed.to);
        if (toSocket && toSocket?.readyState === WebSocket.OPEN) {
          toSocket.send(JSON.stringify({
            type: 'message',
            from: parsed.from,
            message: parsed.content,
          }));
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    if (currentUserId) {
      users.delete(currentUserId);
      console.log(`user ${currentUserId} disconnected`);
    }
  });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Private chat server listening on http://localhost:${PORT}`);
});
