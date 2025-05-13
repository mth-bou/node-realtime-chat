import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ClientMessage, Message, ServerMessage } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientPath = join(__dirname, '../../dist/client/index.html');

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    if (process.env.NODE_ENV === 'production') {
      try {
        const html = await readFile(join(__dirname, '../../dist/client/index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } catch {
        res.writeHead(500);
        res.end('Erreur interne');
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end();
    }
  }
});
const wss = new WebSocketServer({ server });

const users = new Map<string, WebSocket>();
const history = new Map<string, Message[]>();

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
      currentUserId = parsed.userId;
      users.set(currentUserId, ws);
      console.log(`user ${currentUserId} connected`);

      const userHistory = history.get(currentUserId) || [];
      userHistory.forEach((msg: Message) => {
        ws.send(JSON.stringify({ type: 'message', from: msg.from, content: msg.content }));
      });

      return;
    }

    if (parsed.type === 'message') {
      const { from, to, content } = parsed;
      const recipientSocket = users.get(to);

      const msg = { from, content };
      if (!history.has(to)) history.set(to, []);
      history.get(to)!.push(msg);

      if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
        const serverMsg: ServerMessage = {
          type: 'message',
          ...msg
        }
        recipientSocket.send(JSON.stringify(serverMsg));
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
