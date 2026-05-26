// Silence libsignal's noisy console logs (e.g., "Closing session: SessionEntry", "Opening session")
const originalConsoleInfo = console.info;
console.info = function (...args) {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Closing session:') ||
     args[0].includes('Opening session:') ||
     args[0].includes('Removing old closed session:'))
  ) {
    return;
  }
  originalConsoleInfo.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = function (...args) {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Session already closed') ||
     args[0].includes('Session already open'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

import dotenv from 'dotenv';
import next from 'next';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { parse } from 'url';
import { whatsappManager } from './services/whatsapp';
import { campaignManager } from './services/campaign';
import { setupSockets } from './sockets';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const start = async () => {
  await nextApp.prepare();
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  setupSockets(io);
  
  // Render exige host '0.0.0.0' e porta dinâmica via process.env.PORT
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = process.env.HOST || '0.0.0.0';
  
  httpServer.listen(PORT, HOST, () => {
    console.log(`> Server listening on http://${HOST}:${PORT}`);
    // Initialize services (campaign manager handles scheduled campaigns)
    campaignManager.resumeAllScheduledCampaigns();
  });
};

start();

