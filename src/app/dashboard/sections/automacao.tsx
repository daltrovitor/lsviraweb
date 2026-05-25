'use client';

import { useState } from 'react';
import { 
  Settings2, Sliders, Calendar, Check, Sparkles, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const updateAutomation = (field: keyof typeof DEFAULT_AUTOMATION, value: any) => {
    setAutomation(prev => ({ ...prev, [field]: value }));
  };

  const toggleDia = (dia: string) => {
    const currentDays = automation.diasAtivos || [];
    const newDays = currentDays.includes(dia)
      ? currentDays.filter(d => d !== dia)
      : [...currentDays, dia];
    setAutomation(prev => ({ ...prev, diasAtivos: newDays }));
  };

  const handleSave = () => {
    // Aqui seria salva a configuração no perfil do usuário no Supabase
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-5xl mx-auto">
      <AnimatePresence>
        {showSavedToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-navy-900 text-gold-400 font-black px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl z-50 text-sm border border-gold-400/20"
          >
            <Check size={18} />
            Configurações salvas com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-navy-950 flex items-center gap-3 tracking-tight">
            Automação Avançada
            <span className="text-xs font-bold px-3 py-1 bg-navy-900 text-gold-400 rounded-full shadow-sm">
              Anti-Ban Ativo
            </span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Gerencie limites, horários e simulação humana para proteger seu número.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-gold-400 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 shrink-0">
          <Sparkles size={16} /> Presets Seguros
        </button>
      </div>

      <div className="space-y-6">
        {/* Cadence Config Card */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="font-bold text-navy-950 flex items-center gap-2 text-lg mb-6">
            <Sliders className="text-gold-500" size={20} />
            Horários & Cadência
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Delay Mínimo (seg)', field: 'delayMin', type: 'number' },
              { label: 'Delay Máximo (seg)', field: 'delayMax', type: 'number' },
              { label: 'Máximo por Hora', field: 'maxPerHour', type: 'number' },
              { label: 'Máximo Diário', field: 'maxPerDay', type: 'number' },
              { label: 'Horário de Início', field: 'startTime', type: 'time' },
              { label: 'Horário de Término', field: 'endTime', type: 'time' },
            ].map(item => (
              <div key={item.field} className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</label>
                <input 
                  type={item.type} 
                  value={(automation as any)[item.field]}
                  onChange={(e) => updateAutomation(item.field as any, item.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-all text-navy-950"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 mb-8 pt-8 border-t border-slate-100">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Calendar size={14} className="text-navy-900" />
                Dias da Semana Ativos
              </label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map(dia => {
                  const isActive = automation.diasAtivos.includes(dia);
                  return (
                    <button
                      key={dia}
                      onClick={() => toggleDia(dia)}
                      className={`px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 border ${
                        isActive 
                          ? "bg-navy-900 text-gold-400 border-navy-900 shadow-sm" 
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 block">Velocidade Geral</label>
              <div className="inline-flex bg-slate-50 p-1 border border-slate-200 rounded-2xl">
                {(['Lenta', 'Media', 'Rapida'] as const).map(vel => (
                  <button
                    key={vel}
                    onClick={() => updateAutomation('velocidade', vel)}
                    className={`min-w-[90px] px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 text-center ${
                      automation.velocidade === vel 
                        ? "bg-white text-navy-950 shadow-sm border border-slate-200/50" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {vel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Anti-ban section */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <ShieldCheck size={120} className="text-slate-50 opacity-50" />
          </div>
          
          <div className="relative z-10">
            <h2 className="font-bold text-navy-950 flex items-center gap-2 text-lg mb-6">
              <ShieldCheck className="text-emerald-500" size={20} />
              Configurações Anti-Ban
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Pausa a cada (msgs)', field: 'pauseEveryX', step: 1 },
                { label: 'Pausa Mín. (min)', field: 'pauseDurationMin', step: 1 },
                { label: 'Pausa Máx. (min)', field: 'pauseDurationMax', step: 1 },
                { label: 'Fadiga Progressiva', field: 'fatigue', step: 0.1 },
              ].map(item => (
                <div key={item.field} className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</label>
                  <input 
                    type="number" 
                    step={item.step}
                    value={(automation as any)[item.field]}
                    onChange={(e) => updateAutomation(item.field as any, Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-all text-navy-950"
                  />
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="font-bold text-amber-900">Como funciona a Segurança</h4>
                <p className="text-sm text-amber-700/80 mt-1 font-medium leading-relaxed">
                  O WhatsApp bloqueia contas que enviam mensagens em intervalos exatos. A configuração de "Fadiga" aumenta o tempo entre envios à medida que mais mensagens são enviadas na mesma hora, simulando perfeitamente o comportamento de um ser humano se cansando.
                </p>
              </div>
            </div>
          </div>
        </section>

        <button 
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-navy-900 hover:bg-navy-800 text-gold-400 font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-navy-900/10 active:scale-[0.99]"
        >
          <Settings2 size={20} /> Salvar Parâmetros de Automação
        </button>
      </div>
    </div>
  );
}
