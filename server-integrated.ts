// ============================================
// Next.js custom server with Socket.io (no Express)
// ============================================

import { createServer as createHttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import next from 'next';
import { whatsappManager } from './server/services/whatsapp';
import { campaignManager } from './server/services/campaign';
import { setupSockets } from './server/sockets';
import { parse } from 'url';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

const start = async () => {
  const nextApp = next({ dev });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const httpServer = createHttpServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  setupSockets(io);

  httpServer.listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
    // Initialize services
    if (whatsappManager?.initialize) whatsappManager.initialize();
    if (campaignManager?.resumeAllScheduledCampaigns) campaignManager.resumeAllScheduledCampaigns();
  });
};

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
