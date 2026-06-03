'use server';

import { AutomationSettings } from '@/types';

export async function validateAutomationSettings(
  settings: AutomationSettings
): Promise<{ valid: boolean; error?: string }> {
  if (settings.delayMin < 1 || settings.delayMax < settings.delayMin) {
    return { valid: false, error: 'Delays inválidos' };
  }
  if (settings.maxPerHour < 1 || settings.maxPerDay < 1) {
    return { valid: false, error: 'Limites devem ser positivos' };
  }
  return { valid: true };
}
