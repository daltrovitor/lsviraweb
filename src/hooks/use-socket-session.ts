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

    const register = async () => {
      let token: string | undefined;
      try {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token;
        }
      } catch (err) {
        console.error('Error fetching session token for socket:', err);
      }
      socket.emit('register', { userId: user.id, token });
    };

    const onConnect = () => {
      register();
    };

    if (socket.connected) {
      register();
    }
    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
    };
  }, [user?.id]);
}
