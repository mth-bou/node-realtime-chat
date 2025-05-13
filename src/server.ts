import http from 'node:http';
import { WebSocketServer } from 'ws';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// required for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    try {
      const html = await readFile(join(__dirname, '../public/index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>500 Internal Server Error</h1>');
    }
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('new client connected');

  ws.on('message', (data) => {
    const message = data.toString();
    console.log(`received: ${message}`);

    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('client disconnected');
  });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
