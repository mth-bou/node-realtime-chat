import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { beforeAll, afterAll, test, describe, expect } from "vitest";

let server: http.Server;
let wss: WebSocketServer;

beforeAll(() => {
  return new Promise<void>((resolve) => {
    server = http.createServer();
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      ws.on('message', (msg) => {
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(msg);
          }
        });
      });
    });

    server.listen(1234, resolve);
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    wss.close(() => server.close(() => resolve()));
  });
});

test('Echo messages back to client', async () => {
  const ws1 = new WebSocket('ws://localhost:1234');
  const ws2 = new WebSocket('ws://localhost:1234');

  await new Promise<void>((resolve, reject) => {
    ws2.on('message', (msg) => {
      expect(msg.toString()).toBe('Hello from ws1');
      ws1.close();
      ws2.close();
      resolve();
    });

    ws1.on('open', () => {
      setTimeout(() => ws1.send('Hello from ws1'), 50);
    });

    ws2.on('error', reject);
    ws1.on('error', reject);
  });
});