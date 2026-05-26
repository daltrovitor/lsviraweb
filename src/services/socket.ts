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

// Mock socket for Vercel deployment (no backend server)
const mockSocket = {
  connected: false,
  id: null,
  emit: () => {},
  on: () => mockSocket,
  off: () => mockSocket,
  connect: () => {},
  disconnect: () => {},
} as unknown as Socket;

// Disable socket for Vercel (no backend server)
export const socket: Socket = mockSocket;

/** Call after login so we don't spam connection errors on the auth screen. */
export function connectSocket(): void {
  // Disabled for Vercel deployment
  console.log('Socket connection disabled for Vercel deployment');
}

export function disconnectSocket(): void {
  // Disabled for Vercel deployment
}
