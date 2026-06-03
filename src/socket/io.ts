// src/socket/io.ts

import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setIO(io: SocketIOServer) {
  ioInstance = io;
}

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.io instance not set');
  }
  return ioInstance;
}
