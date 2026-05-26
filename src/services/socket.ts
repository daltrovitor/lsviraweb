// src/services/socket.ts

import { io, Socket } from 'socket.io-client';

function resolveSocketUrl(): string {
  if (typeof window !== 'undefined') {
    // Always use the same origin as the page (integrated Next + Socket server)
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
}

const SOCKET_URL = resolveSocketUrl();

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  transports: ['websocket', 'polling'],
});

/** Call after login so we don't spam connection errors on the auth screen. */
export function connectSocket(): void {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socket.connected) {
    socket.disconnect();
  }
}
