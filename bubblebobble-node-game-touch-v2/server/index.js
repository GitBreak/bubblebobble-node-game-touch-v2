import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));

const VERSION = '2025.08.10.015241';
app.get('/api/health', (_req, res) => res.json({ ok: true, version: VERSION }));

app.get('/', (req, res, next) => {
  const indexPath = path.join(clientDist, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) return next(err);
    const injected = html.replace('</body>', `<script>window.__BUILD_VERSION__ = '2025.08.10.015241';</script></body>`);
    res.set('Content-Type', 'text/html').send(injected);
  });
});

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.emit('welcome', { msg: 'connected to server', version: VERSION });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
