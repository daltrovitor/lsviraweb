'use client';

import { useState, useEffect } from 'react';
import { Settings2, Sliders, Calendar, Check, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AutomationSettings } from '@/types';
import { DEFAULT_AUTOMATION, loadAutomationFromStorage, saveAutomationToStorage } from '@/lib/automation-storage';
import { validateAutomationSettings } from '@/lib/actions/automation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

export function AutomacaoModule() {
  const [automation, setAutomation] = useState<AutomationSettings>(DEFAULT_AUTOMATION);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setAutomation(loadAutomationFromStorage());
  }, []);

  const update = <K extends keyof AutomationSettings>(field: K, value: AutomationSettings[K]) => {
    setAutomation((p) => ({ ...p, [field]: value }));
  };

  const toggleDia = (dia: string) => {
    const days = automation.diasAtivos.includes(dia)
      ? automation.diasAtivos.filter((d) => d !== dia)
      : [...automation.diasAtivos, dia];
    update('diasAtivos', days);
  };

  const applyPreset = () => {
    setAutomation({
      ...DEFAULT_AUTOMATION,
      delayMin: 20,
      delayMax: 50,
      maxPerHour: 30,
      velocidade: 'Lenta',
    });
  };

  const handleSave = async () => {
    const result = await validateAutomationSettings(automation);
    if (!result.valid) {
      alert(result.error);
      return;
    }
    saveAutomationToStorage(automation);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const fields: { label: string; field: keyof AutomationSettings; type: string; step?: number }[] = [
    { label: 'Delay mínimo (seg)', field: 'delayMin', type: 'number' },
    { label: 'Delay máximo (seg)', field: 'delayMax', type: 'number' },
    { label: 'Máximo por hora', field: 'maxPerHour', type: 'number' },
    { label: 'Máximo diário', field: 'maxPerDay', type: 'number' },
    { label: 'Início', field: 'startTime', type: 'time' },
    { label: 'Término', field: 'endTime', type: 'time' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 glass-panel-dark px-6 py-3 rounded-full flex items-center gap-2 text-gold-400 font-bold text-sm shadow-2xl"
          >
            <Check size={18} />
            Configurações salvas
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="Automação avançada"
        description="Limites, horários e simulação humana para proteger seu número."
        action={
          <div className="flex gap-2">
            <Badge variant="gold">Anti-Ban</Badge>
            <Button variant="secondary" onClick={applyPreset}>
              <Sparkles size={16} />
              Preset seguro
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Card glow>
          <CardTitle className="flex items-center gap-2 mb-6">
            <Sliders className="text-gold-500" size={20} />
            Horários & cadência
          </CardTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {fields.map((item) => (
              <div key={item.field} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">{item.label}</label>
                <input
                  type={item.type}
                  value={automation[item.field] as string | number}
                  onChange={(e) =>
                    update(
                      item.field,
                      item.type === 'number' ? Number(e.target.value) : e.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-v-blue-500/25 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 pt-6 border-t border-slate-100">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                <Calendar size={14} /> Dias ativos
              </p>
              <div className="flex flex-wrap gap-2">
                {DIAS.map((dia) => {
                  const active = automation.diasAtivos.includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDia(dia)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        active
                          ? 'bg-navy-900 text-gold-400 border-navy-900'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-3">Velocidade</p>
              <div className="inline-flex bg-slate-50 p-1 rounded-2xl border border-slate-200">
                {(['Lenta', 'Media', 'Rapida'] as const).map((vel) => (
                  <button
                    key={vel}
                    type="button"
                    onClick={() => update('velocidade', vel)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold ${
                      automation.velocidade === vel ? 'bg-white shadow-sm text-navy-950' : 'text-slate-500'
                    }`}
                  >
                    {vel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card glow className="relative overflow-hidden">
          <ShieldCheck className="absolute top-4 right-4 text-slate-100" size={100} />
          <CardTitle className="flex items-center gap-2 mb-6 relative z-10">
            <ShieldCheck className="text-emerald-500" size={20} />
            Anti-ban
          </CardTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
            {(
              [
                ['pauseEveryX', 'Pausa a cada (msgs)', 1],
                ['pauseDurationMin', 'Pausa mín (min)', 1],
                ['pauseDurationMax', 'Pausa máx (min)', 1],
                ['fatigue', 'Fadiga', 0.1],
              ] as const
            ).map(([field, label, step]) => (
              <div key={field}>
                <label className="text-[11px] font-bold text-slate-500 uppercase">{label}</label>
                <input
                  type="number"
                  step={step}
                  value={automation[field]}
                  onChange={(e) => update(field, Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-v-blue-500/25 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="relative z-10 flex gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <AlertTriangle className="text-amber-600 shrink-0" size={22} />
            <p className="text-sm text-amber-800 font-medium leading-relaxed">
              Intervalos variáveis e pausas simulam comportamento humano e reduzem risco de bloqueio no WhatsApp.
            </p>
          </div>
        </Card>

        <Button variant="primary" fullWidth className="py-4 text-base" onClick={handleSave}>
          <Settings2 size={20} className="text-gold-400" />
          Salvar parâmetros
        </Button>
      </div>
    </div>
  );
}
