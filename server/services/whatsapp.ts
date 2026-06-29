import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
  ConnectionState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import { WhatsAppStatus } from '../types';
import { EventEmitter } from 'events';

const makeInMemoryStore = (config?: { logger?: any }) => {
  const contacts: Record<string, any> = {};

  return {
    contacts,
    readFromFile(filePath: string) {
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          if (data && typeof data === 'object') {
            Object.assign(contacts, data.contacts || data || {});
          }
        }
      } catch (e) {}
    },
    async writeToFile(filePath: string) {
      try {
        const tempPath = filePath + '.tmp';
        const data = JSON.stringify({ contacts }, null, 2);
        await fs.promises.writeFile(tempPath, data, 'utf8');
        await fs.promises.rename(tempPath, filePath);
      } catch (e) {}
    },
    bind(ev: any) {
      ev.on('contacts.upsert', (newContacts: any[]) => {
        for (const contact of newContacts) {
          if (contact && contact.id) {
            contacts[contact.id] = { ...(contacts[contact.id] || {}), ...contact };
          }
        }
      });
      ev.on('contacts.update', (updates: any[]) => {
        for (const update of updates) {
          if (update && update.id) {
            contacts[update.id] = { ...(contacts[update.id] || {}), ...update };
          }
        }
      });
      ev.on('messages.upsert', ({ messages }: { messages: any[] }) => {
        if (!messages) return;
        for (const msg of messages) {
          if (!msg || msg.key?.fromMe) continue;
          const jid = msg.key?.participant || msg.key?.remoteJid;
          if (!jid) continue;
          const pushName = msg.pushName;
          if (pushName) {
            if (!contacts[jid]) contacts[jid] = { id: jid };
            if (!contacts[jid].name) contacts[jid].name = pushName;
            if (!contacts[jid].notify) contacts[jid].notify = pushName;
          }
        }
      });
    }
  };
};

const logger = pino({ level: 'silent' });

export class WhatsAppService extends EventEmitter {
  private socket: WASocket | null = null;
  private status: WhatsAppStatus = { connected: false, state: 'disconnected' };
  private sessionPath: string;
  private storePath: string;
  private store: any;
  public userId: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
    const baseDir = path.resolve('./sessions');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    
    this.sessionPath = path.join(baseDir, `auth_info_${userId}`);
    this.storePath = path.join(baseDir, `store_${userId}.json`);
    
    this.store = makeInMemoryStore({ logger });
    try {
      this.store.readFromFile(this.storePath);
    } catch (e) {}

    setInterval(() => {
      try {
        if (this.socket) this.store.writeToFile(this.storePath);
      } catch (e) {}
    }, 10000);
  }

  public async init() {
    const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    this.socket = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state,
      logger,
      browser: ['Disparador', 'Chrome', '1.0.0'],
    });

    this.store.bind(this.socket.ev);

    this.socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Converter QR Buffer para base64 string para transmissão via socket
        // @ts-ignore - QR type can be complex, this works at runtime
        const qrBase64 = typeof qr === 'string' ? qr : (Buffer.isBuffer(qr) ? qr.toString('base64') : Buffer.from(qr).toString('base64'));
        this.status = { ...this.status, state: 'qrcode', qr: qrBase64 };
        console.log(`[WhatsApp ${this.userId}] QR Code gerado (${qrBase64.length} bytes)`);
        this.emit('status', this.userId, this.status);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        this.status = { connected: false, state: 'disconnected' };
        this.emit('status', this.userId, this.status);
        
        if (shouldReconnect) {
          this.init();
        } else {
          if (fs.existsSync(this.sessionPath)) {
            fs.rmSync(this.sessionPath, { recursive: true, force: true });
          }
          this.init();
        }
      } else if (connection === 'open') {
        const user = this.socket?.user;
        this.status = {
          connected: true,
          state: 'connected',
          number: user?.id.split(':')[0],
          name: user?.name,
        };
        this.emit('status', this.userId, this.status);
      }
    });

    this.socket.ev.on('creds.update', saveCreds);
    return this.socket;
  }

  public getStatus(): WhatsAppStatus {
    return this.status;
  }

  public async sendMessage(number: string, message: string) {
    if (!this.socket || !this.status.connected) throw new Error('WhatsApp not connected');

    const sendPromise = (async () => {
      let jid = number.includes('@') ? number : '';
      if (!jid) {
        const cleanNumber = number.replace(/\D/g, '');
        if (cleanNumber.startsWith('1') && cleanNumber.length >= 15) {
          jid = `${cleanNumber}@lid`;
        } else {
          try {
            // onWhatsApp com timeout de 8 segundos
            const onWhatsAppResult = await Promise.race([
              this.socket.onWhatsApp(cleanNumber),
              new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('onWhatsApp timeout')), 8000))
            ]);
            if (onWhatsAppResult && onWhatsAppResult.length > 0) {
              jid = onWhatsAppResult[0].exists ? onWhatsAppResult[0].jid : `${cleanNumber}@s.whatsapp.net`;
            } else {
              jid = `${cleanNumber}@s.whatsapp.net`;
            }
          } catch (e) {
            jid = `${cleanNumber}@s.whatsapp.net`;
          }
        }
      }
      
      // sendMessage com timeout de 15 segundos
      await Promise.race([
        this.socket.sendMessage(jid, { text: message }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('sendMessage timeout')), 15000))
      ]);
    })();

    // Operação inteira de envio com timeout global de 25 segundos
    await Promise.race([
      sendPromise,
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Send operation timeout')), 25000))
    ]);
  }

  public async getGroups() {
    if (!this.socket || !this.status.connected) throw new Error('WhatsApp not connected');
    const groups = await this.socket.groupFetchAllParticipating();
    return Object.values(groups).map(group => ({
      id: group.id,
      name: group.subject,
      size: group.participants.length
    }));
  }

  public async getGroupMembers(groupId: string) {
    if (!this.socket || !this.status.connected) throw new Error('WhatsApp not connected');
    const group = await this.socket.groupMetadata(groupId);
    return group.participants.map(p => {
      const contact = this.store?.contacts[p.id];
      return {
        id: p.id,
        number: p.id.split('@')[0],
        name: contact?.name || contact?.verifiedName || contact?.notify || '',
        admin: p.admin !== null
      };
    });
  }

  public async logout() {
    if (this.socket) {
      await this.socket.logout();
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
      }
      this.status = { connected: false, state: 'disconnected' };
      this.emit('status', this.userId, this.status);
    }
  }
}

class WhatsAppManager extends EventEmitter {
  private services: Map<string, WhatsAppService> = new Map();

  public getService(userId: string): WhatsAppService {
    if (!this.services.has(userId)) {
      const service = new WhatsAppService(userId);
      
      // Propagate events from the individual service to the global manager listener
      service.on('status', (uid, status) => {
        this.emit('status', uid, status);
      });

      // Start connection immediately
      service.init().catch(err => console.error(`Error init whatsapp for ${userId}:`, err));
      
      this.services.set(userId, service);
    }
    return this.services.get(userId)!;
  }
}

export const whatsappManager = new WhatsAppManager();
