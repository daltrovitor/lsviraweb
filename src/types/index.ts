export interface Contact {
  id?: string;
  number: string;
  name: string;
  status?: 'pending' | 'sent' | 'error';
  error?: string;
}

export interface AutomationSettings {
  delayMin: number;
  delayMax: number;
  maxPerHour: number;
  startTime: string;
  endTime: string;
  maxPerDay: number;
  diasAtivos: string[];
  velocidade: 'Lenta' | 'Media' | 'Rapida';
  pauseEveryX: number;
  pauseDurationMin: number;
  pauseDurationMax: number;
  fatigue: number;
  randomVariation: number;
}

export interface Campaign {
  id: string;
  message: string;
  contacts: Contact[];
  delayMin: number;
  delayMax: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped' | 'scheduled';
  stats: {
    sent: number;
    error: number;
    total: number;
    pending: number;
  };
  automation?: AutomationSettings;
  scheduledAt?: string;
}

export interface WhatsAppStatus {
  connected: boolean;
  state: 'connecting' | 'connected' | 'disconnected' | 'qrcode';
  qr?: string;
  number?: string;
  name?: string;
}

export interface ScrapedPlace {
  title: string;
  address: string;
  phone: string;
  website: string;
  rating: string;
  category: string;
  url: string;
}

export interface ScrapeOptions {
  query: string;
  limit: number;
  onlyCellphones?: boolean;
  excludeFixedPhones?: boolean;
  onlyWithInstagramOrWhatsapp?: boolean;
}
