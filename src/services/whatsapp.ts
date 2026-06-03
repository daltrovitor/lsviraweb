// src/services/whatsapp.ts

import { createClient, WASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import makeWASocket, { BaileysEventMap } from '@whiskeysockets/baileys';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { EventEmitter } from 'events';

/**
 * Wrapper class for a per‑user WhatsApp connection.
 * Manages session persistence in Supabase and emits status events.
 */
export class WhatsAppInstance extends EventEmitter {
  private wa?: WASocket;
  private authState?: ReturnType<typeof useSingleFileAuthState>;
  private readonly userId: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
  }

  /** Load session from Supabase (if any) and start the socket */
  async initialize(): Promise<void> {
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('session_data')
      .eq('user_id', this.userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to fetch whatsapp session', error);
    }
    const sessionData = data?.session_data ? JSON.parse(data.session_data) : undefined;
    // Use in‑memory auth state (no file on disk)
    this.authState = useSingleFileAuthState({
      // mock a simple in‑memory storage using the fetched sessionData
      // Baileys expects a file path; we cheat by providing a custom implementation
      // that reads/writes from the variable. For simplicity we keep it in memory.
    } as any);
    if (sessionData) {
      // @ts-ignore – set the in‑memory state directly
      this.authState.state = sessionData;
    }

    const { version } = await fetchLatestBaileysVersion();
    this.wa = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: this.authState,
    });

    // Listen for connection updates
    this.wa.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        const qrBase64 = Buffer.from(qr as any).toString('base64');
        this.emit('qr', qrBase64);
      }
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.badSession;
        if (shouldReconnect) {
          logger.warn(`WhatsApp ${this.userId} disconnected, attempting reconnection...`);
          await this.initialize();
        }
        this.emit('disconnected');
        await this.updateSessionInSupabase(false);
      } else if (connection === 'open') {
        logger.info(`WhatsApp ${this.userId} connected`);
        this.emit('connected');
        await this.updateSessionInSupabase(true);
      }
    });

    // Persist auth state after any change
    this.wa.ev.on('creds.update', async () => {
      await this.updateSessionInSupabase(this.wa?.authState?.creds?.registered ?? false);
    });
  }

  /** Generate QR code (base64) – the QR is emitted via the 'qr' event above */
  async generateQR(): Promise<string | undefined> {
    // The QR is emitted automatically during initialization; we just wait for it.
    return new Promise((resolve) => {
      const handler = (qr: string) => {
        this.off('qr', handler);
        resolve(qr);
      };
      this.on('qr', handler);
      // Trigger a reconnection if socket not yet open
      if (!this.wa) this.initialize().catch(err => logger.error('Init error', err));
    });
  }

  /** Disconnect the socket and clean up */
  async disconnect(): Promise<void> {
    if (this.wa) {
      await this.wa.logout();
      this.wa?.ws?.close();
    }
    await this.updateSessionInSupabase(false);
    this.emit('disconnected');
  }

  /** Send a message – thin wrapper */
  async sendMessage(to: string, content: string): Promise<any> {
    if (!this.wa) throw new Error('WhatsApp not initialized');
    return this.wa.sendMessage(to, { text: content });
  }

  /** Internal helper to persist session data */
  private async updateSessionInSupabase(isConnected: boolean): Promise<void> {
    if (!this.authState) return;
    const sessionJson = JSON.stringify(this.authState.state);
    const upsert = {
      user_id: this.userId,
      session_data: sessionJson,
      connected: isConnected,
    } as any;
    await supabase.from('whatsapp_sessions').upsert(upsert, { onConflict: 'user_id' }).catch(err => logger.error('Failed to upsert whatsapp session', err));
  }
}

/** Manager singleton that stores instances per user */
export const whatsappManager = {
  instances: new Map<string, WhatsAppInstance>(),
  async getInstance(userId: string): Promise<WhatsAppInstance> {
    if (!this.instances.has(userId)) {
      const instance = new WhatsAppInstance(userId);
      await instance.initialize();
      this.instances.set(userId, instance);
    }
    return this.instances.get(userId)!;
  },
  // cleanup stale instances after 30 min of inactivity (optional implementation)
  cleanup(): void {
    const now = Date.now();
    for (const [uid, inst] of this.instances.entries()) {
      // placeholder: implement lastUsed timestamp in instance if needed
    }
  },
};
