import { Campaign, Contact } from '../types';
import { whatsappService } from './whatsapp';
import { EventEmitter } from 'events';
import { supabase } from '../utils/supabase';

export class CampaignService extends EventEmitter {
  private campaign: Campaign | null = null;
  private isPaused: boolean = false;
  private isStopped: boolean = false;
  private sentTimestamps: number[] = [];
  private scheduleTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Limpa timestamps antigos a cada hora
    setInterval(() => this.cleanTimestamps(), 60 * 60 * 1000);
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

  private checkDay(allowedDays: string[]): boolean {
    const dayMap: Record<number, string> = {
      0: 'Dom',
      1: 'Seg',
      2: 'Ter',
      3: 'Qua',
      4: 'Qui',
      5: 'Sex',
      6: 'Sab'
    };
    const todayStr = dayMap[new Date().getDay()];
    return allowedDays.includes(todayStr);
  }

  private checkHour(start: string, end: string): boolean {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = start.split(':').map(Number);
    const startMinutes = startH * 60 + startM;

    const [endH, endM] = end.split(':').map(Number);
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Caso o horário passe da meia noite (ex: 22:00 até 06:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
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

  // Persiste a campanha no banco de dados do Supabase
  private async saveCampaignToDb() {
    if (!supabase || !this.campaign) return;
    try {
      const { error } = await supabase
        .from('campaigns')
        .upsert({
          id: this.campaign.id || undefined,
          message: this.campaign.message,
          contacts: this.campaign.contacts,
          delay_min: this.campaign.delayMin,
          delay_max: this.campaign.delayMax,
          status: this.campaign.status,
          stats: this.campaign.stats,
          automation: this.campaign.automation || {},
          scheduled_at: this.campaign.scheduledAt || null
        });

      if (error) {
        console.error('Erro ao persistir campanha no Supabase:', error.message);
      }
    } catch (err: any) {
      console.error('Erro de persistência no Supabase:', err.message);
    }
  }

  // Carrega campanhas agendadas pendentes ao iniciar o servidor
  public async resumeScheduledCampaigns() {
    if (!supabase) return;
    try {
      console.log('Agendador: Buscando campanhas agendadas no Supabase...');
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'scheduled');

      if (error) throw error;
      if (!data || data.length === 0) {
        console.log('Agendador: Nenhuma campanha agendada pendente encontrada.');
        return;
      }

      console.log(`Agendador: Encontradas ${data.length} campanhas pendentes. Reagendando...`);
      for (const row of data) {
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

        const scheduleTime = new Date(row.scheduled_at).getTime();
        // Se a hora do agendamento já passou, dispara imediatamente. Caso contrário, agenda.
        if (scheduleTime <= Date.now()) {
          console.log(`Agendador: Data do agendamento já passou para a campanha ${row.id}. Iniciando disparos agora.`);
          // Dispara em background para não bloquear o loop de inicialização do servidor
          this.startCampaign(camp).catch(err => console.error(err));
        } else {
          console.log(`Agendador: Campanha ${row.id} reagendada com sucesso para ${new Date(scheduleTime).toLocaleString('pt-BR')}`);
          this.startCampaign(camp).catch(err => console.error(err));
        }
      }
    } catch (err: any) {
      console.error('Erro ao retomar campanhas agendadas:', err.message);
    }
  }

  public async startCampaign(campaign: Campaign) {
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
      this.scheduleTimeout = null;
    }

    this.campaign = campaign;
    // Se a campanha não tiver ID (veio sem Supabase), geramos um uuid localmente
    if (!this.campaign.id) {
      this.campaign.id = crypto.randomUUID();
    }
    
    this.isPaused = false;
    this.isStopped = false;

    if (campaign.scheduledAt) {
      const scheduledTime = new Date(campaign.scheduledAt).getTime();
      const delay = scheduledTime - Date.now();
      if (delay > 0) {
        this.campaign.status = 'scheduled';
        this.emit('update', this.campaign);
        this.emit('log', `⏰ Campanha agendada para começar em: ${new Date(scheduledTime).toLocaleString('pt-BR')}`);
        
        await this.saveCampaignToDb();

        await new Promise<void>((resolve) => {
          this.scheduleTimeout = setTimeout(() => {
            this.scheduleTimeout = null;
            resolve();
          }, delay);

          const onStop = () => {
            if (this.scheduleTimeout) {
              clearTimeout(this.scheduleTimeout);
              this.scheduleTimeout = null;
            }
            resolve();
          };
          this.once('stopped', onStop);
        });

        if (this.isStopped) {
          this.campaign.status = 'stopped';
          this.emit('update', this.campaign);
          await this.saveCampaignToDb();
          return;
        }

        this.emit('log', `🚀 Iniciando disparos da campanha agendada!`);
      }
    }

    this.campaign.status = 'running';
    this.emit('update', this.campaign);
    await this.saveCampaignToDb();

    let runSentCount = 0;

    for (let i = 0; i < this.campaign.contacts.length; i++) {
      if (this.isStopped) break;

      while (this.isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (this.isStopped) break;
      }

      const contact = this.campaign.contacts[i];
      if (contact.status === 'sent') continue;

      // Loop do agendador e limites de envio
      let passesValidation = false;
      while (!passesValidation) {
        if (this.isStopped) break;
        this.cleanTimestamps();

        const automation = this.campaign.automation;
        if (automation) {
          // 1. Validar Dias Ativos
          if (automation.diasAtivos && automation.diasAtivos.length > 0) {
            if (!this.checkDay(automation.diasAtivos)) {
              this.emit('log', `📅 Agendador: Hoje não é um dia ativo permitido para envios. Permitidos: ${automation.diasAtivos.join(', ')}. Aguardando...`);
              const continued = await this.sleepSafely(30 * 1000); // Dorme 30s
              if (!continued) break;
              continue;
            }
          }

          // 2. Validar Janela de Horário
          if (automation.startTime && automation.endTime) {
            if (!this.checkHour(automation.startTime, automation.endTime)) {
              this.emit('log', `⏰ Agendador: Fora do horário permitido (${automation.startTime} às ${automation.endTime}). Aguardando...`);
              const continued = await this.sleepSafely(30 * 1000); // Dorme 30s
              if (!continued) break;
              continue;
            }
          }

          // 3. Validar Limite por Hora
          if (automation.maxPerHour > 0) {
            const sentLastHour = this.getSentCountLastHour();
            if (sentLastHour >= automation.maxPerHour) {
              this.emit('log', `⚠️ Limite: Limite de envios por hora atingido (${automation.maxPerHour} msgs). Aguardando liberação...`);
              const continued = await this.sleepSafely(10 * 1000); // Dorme 10s
              if (!continued) break;
              continue;
            }
          }

          // 4. Validar Limite Diário
          if (automation.maxPerDay > 0) {
            const sentLastDay = this.getSentCountLast24Hours();
            if (sentLastDay >= automation.maxPerDay) {
              this.emit('log', `🚫 Limite: Limite diário de envios atingido (${automation.maxPerDay} msgs). Aguardando novo ciclo...`);
              const continued = await this.sleepSafely(10 * 1000); // Dorme 10s
              if (!continued) break;
              continue;
            }
          }
        }

        passesValidation = true;
      }

      if (this.isStopped) break;

      try {
        const personalizedMessage = this.campaign.message
          .replace(/{nome}/g, contact.name)
          .replace(/{numero}/g, contact.number);

        await whatsappService.sendMessage(contact.number, personalizedMessage);
        
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

      this.emit('update', this.campaign);
      await this.saveCampaignToDb(); // Salva estado atualizado na fila a cada envio

      if (this.isStopped) break;

      // Proteção Anti-Ban: Pausa estendida a cada X mensagens
      const automation = this.campaign.automation;
      if (automation && automation.pauseEveryX > 0 && runSentCount % automation.pauseEveryX === 0 && i < this.campaign.contacts.length - 1) {
        const pauseMin = automation.pauseDurationMin || 5;
        const pauseMax = automation.pauseDurationMax || 15;
        const pauseDurationMinutes = Math.floor(Math.random() * (pauseMax - pauseMin + 1) + pauseMin);
        
        this.emit('log', `🛡️ Proteção Anti-Ban: Limite parcial de ${automation.pauseEveryX} envios alcançado. Iniciando pausa de segurança de ${pauseDurationMinutes} minutos...`);
        const continued = await this.sleepSafely(pauseDurationMinutes * 60 * 1000);
        if (!continued) break;
      }

      // Intervalo entre envios (Cooldown)
      if (i < this.campaign.contacts.length - 1 && !this.isStopped) {
        let delaySeconds = 0;
        if (automation) {
          const baseDelay = Math.floor(
            Math.random() * (automation.delayMax - automation.delayMin + 1) +
              automation.delayMin
          );
          
          const sentLastHour = this.getSentCountLastHour();
          const fatigueSeconds = (automation.fatigue || 0) * sentLastHour;
          delaySeconds = baseDelay + fatigueSeconds;

          if (automation.randomVariation > 0) {
            const variationPercent = (Math.random() * 2 - 1) * (automation.randomVariation / 100);
            delaySeconds = delaySeconds * (1 + variationPercent);
          }
          delaySeconds = Math.max(1, delaySeconds);
        } else {
          delaySeconds = Math.floor(
            Math.random() * (this.campaign.delayMax - this.campaign.delayMin + 1) +
              this.campaign.delayMin
          );
        }

        this.emit('log', `Aguardando ${delaySeconds.toFixed(1)}s para o próximo envio...`);
        const continued = await this.sleepSafely(delaySeconds * 1000);
        if (!continued) break;
      }
    }

    if (!this.isStopped) {
      this.campaign.status = 'completed';
    } else {
      this.campaign.status = 'stopped';
    }
    this.emit('update', this.campaign);
    await this.saveCampaignToDb();
  }

  public pause() {
    this.isPaused = true;
    if (this.campaign) {
      this.campaign.status = 'paused';
      this.emit('update', this.campaign);
      this.saveCampaignToDb();
    }
  }

  public resume() {
    this.isPaused = false;
    if (this.campaign) {
      this.campaign.status = 'running';
      this.emit('update', this.campaign);
      this.saveCampaignToDb();
    }
  }

  public stop() {
    this.isStopped = true;
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
      this.scheduleTimeout = null;
    }
    if (this.campaign) {
      this.campaign.status = 'stopped';
      this.emit('update', this.campaign);
      this.saveCampaignToDb();
    }
    this.emit('stopped');
  }
}

export const campaignService = new CampaignService();
