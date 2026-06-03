// src/server.ts

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { logger } from './lib/logger';
import { setIO } from './socket/io';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Next.js request handling
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
    handle(req, res, {
      pathname: parsedUrl.pathname,
      query: Object.fromEntries(parsedUrl.searchParams),
    });
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  setIO(io);
  // Initialize central socket logic
  import('./socket').then(({ initSocket }) => {
    initSocket(io);
    logger.info('Socket.io initialized');
  }).catch(err => {
    logger.error('Failed to initialize socket.io', err);
  });

  httpServer.listen(port, () => {
    logger.info(`> Server listening on http://localhost:${port}`);
  });
}).catch(err => {
  logger.error('Error preparing Next app', err);
  process.exit(1);
});

export {};
