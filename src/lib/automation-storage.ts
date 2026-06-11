'use client';

import { AutomationSettings } from '@/types';

const STORAGE_KEY = 'leadscrap_automation';

export const DEFAULT_AUTOMATION: AutomationSettings = {
  delayMin: 15,
  delayMax: 45,
  maxPerHour: 40,
  startTime: '08:00',
  endTime: '19:00',
  maxPerDay: 200,
  diasAtivos: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
  velocidade: 'Media',
  pauseEveryX: 15,
  pauseDurationMin: 5,
  pauseDurationMax: 15,
  fatigue: 0.4,
  randomVariation: 30,
};

export function loadAutomationFromStorage(): AutomationSettings {
  if (typeof window === 'undefined') return DEFAULT_AUTOMATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
<<<<<<< HEAD
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!raw) return { ...DEFAULT_AUTOMATION, timezone: localTz };
    return { ...DEFAULT_AUTOMATION, timezone: localTz, ...JSON.parse(raw) };
=======
    if (!raw) return DEFAULT_AUTOMATION;
    return { ...DEFAULT_AUTOMATION, ...JSON.parse(raw) };
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
  } catch {
    return DEFAULT_AUTOMATION;
  }
}

export function saveAutomationToStorage(settings: AutomationSettings): void {
<<<<<<< HEAD
  const localTz = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
  const settingsWithTz = {
    ...settings,
    timezone: localTz || settings.timezone
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsWithTz));
=======
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
}
