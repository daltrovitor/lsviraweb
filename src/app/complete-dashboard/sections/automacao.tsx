'use client';

import { useState } from 'react';
import { 
  Settings2,
  Sliders,
  Calendar,
  Clock,
  Check,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

const DEFAULT_AUTOMATION = {
  delayMin: 15,
  delayMax: 45,
  maxPerHour: 40,
  startTime: "08:00",
  endTime: "19:00",
  maxPerDay: 200,
  diasAtivos: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
  velocidade: 'Media',
  pauseEveryX: 15,
  pauseDurationMin: 5,
  pauseDurationMax: 15,
  fatigue: 0.4,
  randomVariation: 30,
};

export default function AutomacaoSection() {
  const [automation, setAutomation] = useState(DEFAULT_AUTOMATION);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const updateAutomation = (field: keyof typeof DEFAULT_AUTOMATION, value: any) => {
    setAutomation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleDia = (dia: string) => {
    const currentDays = automation.diasAtivos || [];
    const newDays = currentDays.includes(dia)
      ? currentDays.filter(d => d !== dia)
      : [...currentDays, dia];
    setAutomation(prev => ({
      ...prev,
      diasAtivos: newDays
    }));
  };

  const handleSave = () => {
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 3000);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto text-slate-800 animate-fade-in relative">
      {/* Saved Toast */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-blue-900 text-yellow-400 font-extrabold px-6 py-3 rounded-full flex items-center gap-2 shadow-xl shadow-blue-950/20 z-50 text-xs border border-yellow-400/20"
          >
            <Check size={16} />
            Parâmetros salvos com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-5 mb-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950 flex items-center gap-2">
            Configurações de Automação
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-900 text-yellow-400 rounded-full">
              Anti-Ban Ativo
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Gerencie limites diários, janela ativa de envios e simulações humanas.
          </p>
        </div>
        
        <button 
          onClick={() => setIsQuizOpen(true)}
          className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-yellow-400 border border-yellow-400/10 px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:shadow-lg shadow-blue-900/5 active:scale-95 shrink-0"
        >
          <Sparkles className="text-yellow-400" size={14} />
          Configuração Rápida
        </button>
      </header>

      {/* Cadence Config Card */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-blue-950 flex items-center gap-2 text-base">
            <span className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
              <Sliders size={16} />
            </span>
            Horários de Atividade & Cadência
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delay Mínimo (seg)</label>
            <input 
              type="number" 
              value={automation.delayMin}
              onChange={(e) => updateAutomation('delayMin', Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delay Máximo (seg)</label>
            <input 
              type="number" 
              value={automation.delayMax}
              onChange={(e) => updateAutomation('delayMax', Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Máx por Hora</label>
            <input 
              type="number" 
              value={automation.maxPerHour}
              onChange={(e) => updateAutomation('maxPerHour', Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Início</label>
            <input 
              type="time" 
              value={automation.startTime}
              onChange={(e) => updateAutomation('startTime', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Término</label>
            <input 
              type="time" 
              value={automation.endTime}
              onChange={(e) => updateAutomation('endTime', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Máx por Dia</label>
            <input 
              type="number" 
              value={automation.maxPerDay}
              onChange={(e) => updateAutomation('maxPerDay', Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-900" />
              Dias Ativos
            </label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map(dia => {
                const isActive = (automation.diasAtivos || []).includes(dia);
                return (
                  <button
                    key={dia}
                    onClick={() => toggleDia(dia)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border",
                      isActive 
                        ? "bg-blue-900 text-yellow-400 border-blue-900 shadow-sm" 
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"
                    )}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shrink-0">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Velocidade</label>
            <div className="inline-flex bg-slate-50 p-1 border border-slate-200 rounded-2xl">
              {(['Lenta', 'Media', 'Rapida'] as const).map(vel => (
                <button
                  key={vel}
                  onClick={() => updateAutomation('velocidade', vel)}
                  className={cn(
                    "min-w-[80px] px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 text-center",
                    automation.velocidade === vel 
                      ? "bg-white text-blue-950 shadow-sm border border-slate-200/50" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {vel}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-yellow-400 font-extrabold transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm shadow-blue-900/5"
        >
          <Settings2 size={16} /> Gravar e Aplicar
        </button>
      </section>

      {/* Anti-ban section */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-blue-950 flex items-center gap-2 text-base">
            <span className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
              <ShieldCheck size={16} />
            </span>
            Escudo Anti-Ban
          </h2>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ativo
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pausa a cada X</label>
            <input 
              type="number" 
              value={automation.pauseEveryX}
              onChange={(e) => updateAutomation('pauseEveryX', Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempo Pausa (min)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={automation.pauseDurationMin}
                onChange={(e) => updateAutomation('pauseDurationMin', Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold text-center"
              />
              <span className="text-slate-400 text-xs font-bold">a</span>
              <input 
                type="number" 
                value={automation.pauseDurationMax}
                onChange={(e) => updateAutomation('pauseDurationMax', Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold text-center"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fadiga (s)</label>
            <input 
              type="number" 
              step="0.1"
              value={automation.fatigue}
              onChange={(e) => updateAutomation('fatigue', Math.max(0, parseFloat(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Variação (%)</label>
            <input 
              type="number" 
              value={automation.randomVariation}
              onChange={(e) => updateAutomation('randomVariation', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
          </div>
        </div>

        <div className="bg-yellow-50/50 border border-yellow-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-xs font-bold text-slate-850">Segurança WhatsApp</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-medium">
              O WhatsApp detecta comportamentos repetitivos de robôs. Os delays aleatórios e fadiga progressiva simulam o comportamento humano.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
