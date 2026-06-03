// src/socket/index.ts

import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { whatsappManager } from '../services/whatsapp';

export function initSocket(io: SocketIOServer) {
  io.use(async (socket, next) => {
    try {
      // Expect Supabase session cookie in the handshake query
      const { token } = socket.handshake.auth as { token?: string };
      if (!token) return next(new Error('No auth token'));
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return next(new Error('Invalid user'));
      // Attach userId to socket data
      (socket as any).userId = user.id;
      next();
    } catch (err) {
      logger.error('Socket auth error', err);
      next(err as any);
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const room = `user:${userId}`;
    socket.join(room);
    logger.info(`Socket connected: ${socket.id} -> ${room}`);

    // Store socket id in Supabase table
    supabase.from('socket_connections').insert({
      user_id: userId,
      socket_id: socket.id,
      connected_at: new Date().toISOString(),
    }).catch(err => logger.error('Failed to log socket connection', err));

    // Listen for client‑side events if any (e.g., manual disconnect)
    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})`);
      // Clean up socket record
      await supabase.from('socket_connections').delete().eq('socket_id', socket.id).catch(err => logger.error('Failed to delete socket record', err));
      // Optionally clean up WhatsApp instance after inactivity – handled elsewhere
    });
  });
}
