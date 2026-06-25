import { Campaign, Contact } from '../types';
import { whatsappManager } from './whatsapp';
import { EventEmitter } from 'events';
import { supabase } from '../utils/supabase';

// Helper function to parse user scheduled time forcing Brazil timezone America/Sao_Paulo (UTC-3)
function parseScheduledTime(scheduledAt: string): Date {
  if (scheduledAt.includes('Z') || /[-+]\d{2}:\d{2}$/.test(scheduledAt)) {
    return new Date(scheduledAt);
  }
  return new Date(`${scheduledAt}-03:00`);
}

export class CampaignService extends EventEmitter {
  private campaign: Campaign | null = null;
  private isPaused: boolean = false;
  private isStopped: boolean = false;
  private sentTimestamps: number[] = [];
  private scheduleTimeout: NodeJS.Timeout | null = null;
  public userId: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
    setInterval(() => this.cleanTimestamps(), 60 * 60 * 1000);
  }

  public getCampaign(): Campaign | null {
    return this.campaign;
  }

  private cleanTimestamps() {
    const now = Date.now();
    this.sentTimestamps = this.sentTimestamps.filter(t => now - t < 24 * 60 * 60 * 1000);
  }

  private getSentCountLastHour(): number {
    const now = Date.now();
    return this.sentTimestamps.filter(t => now - t < 60 * 60 * 1000).length;
  }

  private getSentCountLast24Hours(): number {
    const now = Date.now();
    return this.sentTimestamps.filter(t => now - t < 24 * 60 * 60 * 1000).length;
  }

  private getLocalDateParts(timeZone: string = 'America/Sao_Paulo'): { hour: number; minute: number; dayOfWeek: number } {
    try {
      const date = new Date();
      
      const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' });
      const weekdayStr = weekdayFormatter.format(date);
      
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      const parts = timeFormatter.formatToParts(date);
      const hour = Number(parts.find(p => p.type === 'hour')?.value ?? date.getHours());
      const minute = Number(parts.find(p => p.type === 'minute')?.value ?? date.getMinutes());
      
      const dayMap: Record<string, number> = {
        'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
      };
      const dayOfWeek = dayMap[weekdayStr] ?? date.getDay();
      
      return { hour, minute, dayOfWeek };
    } catch (err) {
      const date = new Date();
      return { hour: date.getHours(), minute: date.getMinutes(), dayOfWeek: date.getDay() };
    }
  }

  private checkDay(allowedDays: string[], timezone?: string): boolean {
    const { dayOfWeek } = this.getLocalDateParts(timezone);
    const dayMap: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab' };
    return allowedDays.includes(dayMap[dayOfWeek]);
  }

  private checkHour(start: string, end: string, timezone?: string): boolean {
    const { hour, minute } = this.getLocalDateParts(timezone);
    const currentMinutes = hour * 60 + minute;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (startMinutes <= endMinutes) return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  private async sleepSafely(durationMs: number): Promise<boolean> {
    const chunkMs = 500;
    let elapsed = 0;
    while (elapsed < durationMs) {
      if (this.isStopped) return false;
      while (this.isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (this.isStopped) return false;
      }
      const sleepTime = Math.min(chunkMs, durationMs - elapsed);
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
      elapsed += sleepTime;
    }
    return !this.isStopped;
  }

  private async saveCampaignToDb() {
    if (!supabase || !this.campaign) return;
    try {
      await supabase.from('campaigns').upsert({
        id: this.campaign.id || undefined,
        user_id: this.userId,
        name: this.campaign.name || 'Campanha sem nome',
        message: this.campaign.message,
        contacts: this.campaign.contacts,
        delay_min: this.campaign.delayMin,
        delay_max: this.campaign.delayMax,
        status: this.campaign.status,
        stats: this.campaign.stats,
        automation: this.campaign.automation || {},
        scheduled_at: this.campaign.scheduledAt ? parseScheduledTime(this.campaign.scheduledAt).toISOString() : null
      });
    } catch (err: any) {
      console.error('Erro de persistência no Supabase:', err.message);
    }
  }

  public async startCampaign(campaign: Campaign) {
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
      this.scheduleTimeout = null;
    }

    this.campaign = campaign;
    if (!this.campaign.id) this.campaign.id = crypto.randomUUID();
    
    this.isPaused = false;
    this.isStopped = false;

    if (campaign.scheduledAt) {
      const scheduledTime = parseScheduledTime(campaign.scheduledAt).getTime();
      const delay = scheduledTime - Date.now();
      if (delay > 0) {
        this.campaign.status = 'scheduled';
        this.emit('update', this.userId, this.campaign);
        const tz = campaign.automation?.timezone || 'America/Sao_Paulo';
        this.emit('log', this.userId, `⏰ Campanha agendada para começar em: ${new Date(scheduledTime).toLocaleString('pt-BR', { timeZone: tz })}`);
        await this.saveCampaignToDb();

        await new Promise<void>((resolve) => {
          this.scheduleTimeout = setTimeout(() => {
            this.scheduleTimeout = null;
            resolve();
          }, delay);
          this.once('stopped', () => {
            if (this.scheduleTimeout) {
              clearTimeout(this.scheduleTimeout);
              this.scheduleTimeout = null;
            }
            resolve();
          });
        });

        if (this.isStopped) {
          this.campaign.status = 'stopped';
          this.emit('update', this.userId, this.campaign);
          await this.saveCampaignToDb();
          return;
        }
        this.emit('log', this.userId, `🚀 Iniciando disparos da campanha agendada!`);
      }
    }

    this.campaign.status = 'running';
    this.emit('update', this.userId, this.campaign);
    await this.saveCampaignToDb();

    let runSentCount = 0;
    const userWhatsApp = whatsappManager.getService(this.userId);

    for (let i = 0; i < this.campaign.contacts.length; i++) {
      if (this.isStopped) break;

      while (this.isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (this.isStopped) break;
      }

      const contact = this.campaign.contacts[i];
      if (contact.status === 'sent') continue;

      let passesValidation = false;
      while (!passesValidation) {
        if (this.isStopped) break;
        this.cleanTimestamps();
        const automation = this.campaign.automation;
        if (automation) {
          if (automation.diasAtivos?.length > 0 && !this.checkDay(automation.diasAtivos, automation.timezone)) {
            this.emit('log', this.userId, `📅 Fora do dia permitido. Aguardando...`);
            if (!await this.sleepSafely(30000)) break;
            continue;
          }
          if (automation.startTime && automation.endTime && !this.checkHour(automation.startTime, automation.endTime, automation.timezone)) {
            this.emit('log', this.userId, `⏰ Fora do horário permitido. Aguardando...`);
            if (!await this.sleepSafely(30000)) break;
            continue;
          }
          if (automation.maxPerHour > 0 && this.getSentCountLastHour() >= automation.maxPerHour) {
            this.emit('log', this.userId, `⚠️ Limite por hora atingido. Aguardando...`);
            if (!await this.sleepSafely(10000)) break;
            continue;
          }
          if (automation.maxPerDay > 0 && this.getSentCountLast24Hours() >= automation.maxPerDay) {
            this.emit('log', this.userId, `🚫 Limite diário atingido. Aguardando...`);
            if (!await this.sleepSafely(10000)) break;
            continue;
          }
        }
        passesValidation = true;
      }

      if (this.isStopped) break;

      try {
        const personalizedMessage = this.campaign.message.replace(/{nome}/g, contact.name).replace(/{numero}/g, contact.number);
        await userWhatsApp.sendMessage(contact.number, personalizedMessage);
        
        contact.status = 'sent';
        this.campaign.stats.sent++;
        this.campaign.stats.pending--;
        runSentCount++;
        this.sentTimestamps.push(Date.now());
      } catch (error: any) {
        contact.status = 'error';
        contact.error = error.message;
        this.campaign.stats.error++;
        this.campaign.stats.pending--;
      }

      this.emit('update', this.userId, this.campaign);
      await this.saveCampaignToDb();

      if (this.isStopped) break;

      const automation = this.campaign.automation;
      if (automation && automation.pauseEveryX > 0 && runSentCount % automation.pauseEveryX === 0 && i < this.campaign.contacts.length - 1) {
        const pauseDurationMinutes = Math.floor(Math.random() * ((automation.pauseDurationMax || 15) - (automation.pauseDurationMin || 5) + 1) + (automation.pauseDurationMin || 5));
        this.emit('log', this.userId, `🛡️ Pausa Anti-Ban de ${pauseDurationMinutes} minutos...`);
        if (!await this.sleepSafely(pauseDurationMinutes * 60 * 1000)) break;
      }

      if (i < this.campaign.contacts.length - 1 && !this.isStopped) {
        let delaySeconds = 0;
        if (automation) {
          delaySeconds = Math.floor(Math.random() * (automation.delayMax - automation.delayMin + 1) + automation.delayMin) + ((automation.fatigue || 0) * this.getSentCountLastHour());
          if (automation.randomVariation > 0) delaySeconds *= (1 + (Math.random() * 2 - 1) * (automation.randomVariation / 100));
        } else {
          delaySeconds = Math.floor(Math.random() * (this.campaign.delayMax - this.campaign.delayMin + 1) + this.campaign.delayMin);
        }
        delaySeconds = Math.max(1, delaySeconds);

        this.emit('log', this.userId, `Aguardando ${delaySeconds.toFixed(1)}s...`);
        if (!await this.sleepSafely(delaySeconds * 1000)) break;
      }
    }

    this.campaign.status = this.isStopped ? 'stopped' : 'completed';
    this.emit('update', this.userId, this.campaign);
    await this.saveCampaignToDb();
  }

  public pause() {
    this.isPaused = true;
    if (this.campaign) {
      this.campaign.status = 'paused';
      this.emit('update', this.userId, this.campaign);
      this.saveCampaignToDb();
    }
  }

  public resume() {
    this.isPaused = false;
    if (this.campaign) {
      this.campaign.status = 'running';
      this.emit('update', this.userId, this.campaign);
      this.saveCampaignToDb();
    }
  }

  public stop() {
    this.isStopped = true;
    if (this.scheduleTimeout) clearTimeout(this.scheduleTimeout);
    if (this.campaign) {
      this.campaign.status = 'stopped';
      this.emit('update', this.userId, this.campaign);
      this.saveCampaignToDb();
    }
    this.emit('stopped');
  }

  public clearCampaign() {
    this.campaign = null;
    this.emit('update', this.userId, null);
  }
}

class CampaignManager extends EventEmitter {
  private services: Map<string, CampaignService> = new Map();

  public getService(userId: string): CampaignService {
    if (!this.services.has(userId)) {
      const service = new CampaignService(userId);
      service.on('update', (uid, camp) => this.emit('update', uid, camp));
      service.on('log', (uid, msg) => this.emit('log', uid, msg));
      this.services.set(userId, service);
    }
    return this.services.get(userId)!;
  }

  public async resumeAllScheduledCampaigns() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('campaigns').select('*').eq('status', 'scheduled');
      if (error || !data) return;

      for (const row of data) {
        if (!row.user_id) continue;
        const camp: Campaign = {
          id: row.id,
          message: row.message,
          contacts: row.contacts,
          delayMin: row.delay_min,
          delayMax: row.delay_max,
          status: row.status as any,
          stats: row.stats,
          automation: row.automation,
          scheduledAt: row.scheduled_at
        };
        const service = this.getService(row.user_id);
        service.startCampaign(camp).catch(err => console.error(err));
      }
    } catch (err: any) {}
  }
}

export const campaignManager = new CampaignManager();
