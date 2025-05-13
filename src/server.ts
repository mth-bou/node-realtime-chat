import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { ClientMessage, ServerMessage } from "./types";

const server = http.createServer();
const wss = new WebSocketServer({ server });

const users = new Map<string, WebSocket>();

wss.on('connection', (ws) => {
  let currentUserId: string | null = null;

  ws.on('message', (data) => {
    let parsed: ClientMessage;

    try {
      parsed = JSON.parse(data.toString());
    } catch (e) {
      const error: ServerMessage = { type: 'error', message: 'Invalid JSON format' };
      ws.send(JSON.stringify(error));
      return
    }

    if (parsed.type === 'login') {
      if (typeof parsed.userId !== 'string') {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid login payload' }));
        return;
      }

      currentUserId = parsed.userId;
      users.set(currentUserId, ws);
      console.log(`user ${currentUserId} connected`);
      return;
    }

    if (parsed.type === 'message') {
      if (
        typeof parsed.from !== 'string' ||
        typeof parsed.to !== 'string' ||
        typeof parsed.content !== 'string'
      ) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message payload' }));
        return;
      }

      const recipientSocket = users.get(parsed.to);
      if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
        const msg: ServerMessage = {
          type: 'message',
          from: parsed.from,
          content: parsed.content,
        }

        recipientSocket.send(JSON.stringify(msg));
      } else {
        const err: ServerMessage = { type: 'error', message: `User ${parsed.to} is not connected` };
        ws.send(JSON.stringify(err));
      }
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
