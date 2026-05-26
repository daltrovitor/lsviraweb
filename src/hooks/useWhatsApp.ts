// src/hooks/useWhatsApp.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { socket, connectSocket } from '@/services/socket';

/**
 * Hook to manage WhatsApp connection, QR code handling and lead scraping.
 * It abstracts all socket communication and provides simple actions for the UI.
 */
export function useWhatsApp() {
  const [qr, setQr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapeProgress, setScrapeProgress] = useState<{ status: string; progress: number; resultsCount?: number } | null>(null);

  // Authenticate the socket after we have a Supabase session
  const authenticateSocket = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setError('Failed to get auth session');
      return;
    }
    const token = data.session?.access_token;
    if (!token) {
      setError('No auth token available');
      return;
    }
    socket.emit('authenticate', { token });
  }, []);

  // Initialise socket listeners once
  useEffect(() => {
    connectSocket();

    // When socket connects, send auth
    socket.on('connect', () => {
      authenticateSocket();
    });

    socket.on('qr', (qrBase64: string) => {
      setQr(qrBase64);
    });
    socket.on('connected', () => {
      setConnected(true);
      setQr(null);
    });
    socket.on('disconnected', () => {
      setConnected(false);
    });
    socket.on('scrape-progress', (payload: any) => {
      setScrapeProgress(payload);
    });
    socket.on('scrape-error', (payload: any) => {
      setError(payload.error || 'Scrape error');
    });
    socket.on('connect_error', (err) => {
      setError(`Socket error: ${err?.message}`);
    });

    return () => {
      socket.off('connect');
      socket.off('qr');
      socket.off('connected');
      socket.off('disconnected');
      socket.off('scrape-progress');
      socket.off('scrape-error');
      socket.off('connect_error');
    };
  }, [authenticateSocket]);

  // Start WhatsApp connection (calls backend to initialise instance)
  const startWhatsApp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/connect');
      if (!res.ok) throw new Error('Failed to start WhatsApp');
      // Backend will emit QR via socket
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manually fetch QR (fallback if not received via socket)
  const fetchQr = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/qr');
      if (!res.ok) throw new Error('QR not available');
      const data = await res.json();
      setQr(data.qr);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // Trigger lead extraction via Maps scraper
  const startScrape = useCallback(async (query: string, limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/maps/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit }),
      });
      if (!res.ok) throw new Error('Failed to enqueue scrape');
      // The progress will be sent through socket events
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    qr,
    connected,
    loading,
    error,
    scrapeProgress,
    startWhatsApp,
    fetchQr,
    startScrape,
  };
}
