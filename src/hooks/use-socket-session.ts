'use client';

import { useEffect } from 'react';
import { socket, connectSocket, disconnectSocket } from '@/services/socket';
import type { User } from '@supabase/supabase-js';

export function useSocketSession(user: User | null) {
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    connectSocket();

    const register = () => {
      socket.emit('register', user.id);
    };

    const onConnect = () => register();

    if (socket.connected) register();
    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
    };
  }, [user?.id]);
}
