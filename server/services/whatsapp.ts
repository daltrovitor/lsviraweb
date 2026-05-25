import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  delay,
  WASocket,
  ConnectionState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import { WhatsAppStatus } from '../types';
import { EventEmitter } from 'events';

// Implementação customizada e leve do makeInMemoryStore compatível com Baileys v7
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
      } catch (e) {
        // Ignora erros na leitura
      }
    },
    writeToFile(filePath: string) {
      try {
        fs.writeFileSync(filePath, JSON.stringify({ contacts }, null, 2), 'utf8');
      } catch (e) {
        // Ignora erros na escrita
      }
    },
    bind(ev: any) {
      ev.on('contacts.upsert', (newContacts: any[]) => {
        for (const contact of newContacts) {
          if (contact && contact.id) {
            contacts[contact.id] = {
              ...(contacts[contact.id] || {}),
              ...contact,
            };
          }
        }
      });

      ev.on('contacts.update', (updates: any[]) => {
        for (const update of updates) {
          if (update && update.id) {
            contacts[update.id] = {
              ...(contacts[update.id] || {}),
              ...update,
            };
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
            if (!contacts[jid]) {
              contacts[jid] = { id: jid };
            }
            if (!contacts[jid].name) {
              contacts[jid].name = pushName;
            }
            if (!contacts[jid].notify) {
              contacts[jid].notify = pushName;
            }
          }
        }
      });
    }
  };
};

const logger = pino({ level: 'silent' });

export class WhatsAppService extends EventEmitter {
  private socket: WASocket | null = null;
  private status: WhatsAppStatus = {
    connected: false,
    state: 'disconnected',
  };
  private sessionPath: string;
  private store: any;

  constructor(sessionPath: string = './auth_info_baileys') {
    super();
    this.sessionPath = path.resolve(sessionPath);
    
    // Inicializa o store de contatos e conversas
    this.store = makeInMemoryStore({ logger });
    try {
      this.store.readFromFile('./baileys_store.json');
    } catch (e) {
      // Ignora se o arquivo de persistência não existir ainda
    }

    // Persiste os dados na memória em arquivo a cada 10 segundos
    setInterval(() => {
      try {
        this.store.writeToFile('./baileys_store.json');
      } catch (e) {
        // Ignora falhas de escrita
      }
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

    // Vincula o store ao emissor de eventos do socket para atualizar contatos/conversas automaticamente
    this.store.bind(this.socket.ev);

    this.socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.status = { ...this.status, state: 'qrcode', qr };
        this.emit('status', this.status);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        this.status = { connected: false, state: 'disconnected' };
        this.emit('status', this.status);
        
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
        this.emit('status', this.status);
      }
    });

    this.socket.ev.on('creds.update', saveCreds);

    return this.socket;
  }

  public getStatus(): WhatsAppStatus {
    return this.status;
  }

  public async sendMessage(number: string, message: string) {
    const socket = this.socket;
    if (!socket || !this.status.connected) {
      throw new Error('WhatsApp not connected');
    }

    let jid = number.includes('@') ? number : '';
    
    if (!jid) {
      const cleanNumber = number.replace(/\D/g, '');
      if (cleanNumber.startsWith('1') && cleanNumber.length >= 15) {
        jid = `${cleanNumber}@lid`;
      } else {
        try {
          const onWhatsAppResult = await socket.onWhatsApp(cleanNumber);
          if (onWhatsAppResult && onWhatsAppResult.length > 0) {
            const result = onWhatsAppResult[0];
            if (result && result.exists) {
              jid = result.jid;
            } else {
              jid = `${cleanNumber}@s.whatsapp.net`;
            }
          } else {
            jid = `${cleanNumber}@s.whatsapp.net`;
          }
        } catch (e) {
          jid = `${cleanNumber}@s.whatsapp.net`;
        }
      }
    }

    await socket.sendMessage(jid, { text: message });
  }

  public async getGroups() {
    const socket = this.socket;
    if (!socket || !this.status.connected) {
      throw new Error('WhatsApp not connected');
    }
    
    const groups = await socket.groupFetchAllParticipating();
    return Object.values(groups).map(group => ({
      id: group.id,
      name: group.subject,
      size: group.participants.length
    }));
  }

  public async getGroupMembers(groupId: string) {
    const socket = this.socket;
    if (!socket || !this.status.connected) {
      throw new Error('WhatsApp not connected');
    }

    const group = await socket.groupMetadata(groupId);
    return group.participants.map(p => {
      // Tenta buscar o contato no cache do store para recuperar o nome exibido no WhatsApp (PushName) ou salvo
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
      this.emit('status', this.status);
    }
  }
}

export const whatsappService = new WhatsAppService();
