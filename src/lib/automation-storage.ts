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
    if (!raw) return DEFAULT_AUTOMATION;
    return { ...DEFAULT_AUTOMATION, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AUTOMATION;
  }
}

export function saveAutomationToStorage(settings: AutomationSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
