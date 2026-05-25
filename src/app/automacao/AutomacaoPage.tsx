'use client';

import { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Clock, 
  Check, 
  ShieldAlert, 
  Sparkles, 
  X, 
  Settings2, 
  Sliders, 
  Calendar, 
  Play, 
  Pause, 
  Square,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Campaign, AutomationSettings, WhatsAppStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

interface AutomacaoPageProps {
  campaign: Campaign;
  setCampaign: React.Dispatch<React.SetStateAction<Campaign>>;
  status: WhatsAppStatus;
  handleStart: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleStop: () => void;
}

const DEFAULT_AUTOMATION: AutomationSettings = {
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

export default function AutomacaoPage({
  campaign,
  setCampaign,
  status,
  handleStart,
  handlePause,
  handleResume,
  handleStop
}: AutomacaoPageProps) {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizVolume, setQuizVolume] = useState<'baixo' | 'medio' | 'alto'>('medio');
  const [quizHorario, setQuizHorario] = useState<'comercial' | '24h'>('comercial');
  const [quizSeguranca, setQuizSeguranca] = useState<'maxima' | 'equilibrada' | 'rapida'>('equilibrada');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Inicializa automação com valores padrão se não existir
  useEffect(() => {
    if (!campaign.automation) {
      setCampaign(prev => ({
        ...prev,
        automation: DEFAULT_AUTOMATION
      }));
    }
  }, [campaign.automation, setCampaign]);

  const automation = campaign.automation || DEFAULT_AUTOMATION;

  const updateAutomation = (field: keyof AutomationSettings, value: any) => {
    setCampaign(prev => ({
      ...prev,
      automation: {
        ...(prev.automation || DEFAULT_AUTOMATION),
        [field]: value
      }
    }));
  };

  const toggleDia = (dia: string) => {
    const currentDays = automation.diasAtivos || [];
    const newDays = currentDays.includes(dia)
      ? currentDays.filter(d => d !== dia)
      : [...currentDays, dia];
    updateAutomation('diasAtivos', newDays);
  };

  const handleSave = () => {
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 3000);
  };

  const executeQuizComplete = () => {
    let settings = { ...DEFAULT_AUTOMATION };
    
    // 1. Volume
    if (quizVolume === 'baixo') {
      settings.maxPerDay = 50;
      settings.maxPerHour = 15;
    } else if (quizVolume === 'medio') {
      settings.maxPerDay = 150;
      settings.maxPerHour = 30;
    } else if (quizVolume === 'alto') {
      settings.maxPerDay = 350;
      settings.maxPerHour = 50;
    }

    // 2. Horário
    if (quizHorario === 'comercial') {
      settings.startTime = "08:00";
      settings.endTime = "18:00";
    } else {
      settings.startTime = "00:00";
      settings.endTime = "23:59";
    }

    // 3. Segurança
    if (quizSeguranca === 'maxima') {
      settings.delayMin = 45;
      settings.delayMax = 90;
      settings.pauseEveryX = 10;
      settings.pauseDurationMin = 10;
      settings.pauseDurationMax = 25;
      settings.fatigue = 0.8;
      settings.randomVariation = 50;
      settings.velocidade = 'Lenta';
    } else if (quizSeguranca === 'equilibrada') {
      settings.delayMin = 20;
      settings.delayMax = 50;
      settings.pauseEveryX = 15;
      settings.pauseDurationMin = 5;
      settings.pauseDurationMax = 15;
      settings.fatigue = 0.4;
      settings.randomVariation = 30;
      settings.velocidade = 'Media';
    } else if (quizSeguranca === 'rapida') {
      settings.delayMin = 8;
      settings.delayMax = 20;
      settings.pauseEveryX = 25;
      settings.pauseDurationMin = 2;
      settings.pauseDurationMax = 8;
      settings.fatigue = 0.15;
      settings.randomVariation = 15;
      settings.velocidade = 'Rapida';
    }

    setCampaign(prev => ({
      ...prev,
      automation: settings
    }));
    
    setIsQuizOpen(false);
    setQuizStep(1);
    handleSave();
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto text-slate-800 animate-fade-in relative">
      {/* Saved Toast Alert */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-blue-900 text-yellow-400 font-extrabold px-6 py-3 rounded-full flex items-center gap-2 shadow-xl shadow-blue-950/20 z-50 text-xs border border-yellow-400/20 glow-gold"
          >
            <Check size={16} />
            Parâmetros de envio salvos e aplicados com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-5 mb-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950 flex items-center gap-2">
            Configurações de Automação
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-900 text-yellow-400 rounded-full">
              Anti-Ban Activo
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Gerencie limites diários, janela ativa de envios e simulações humanas para proteger sua linha.
          </p>
        </div>
        
        <button 
          onClick={() => setIsQuizOpen(true)}
          className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-yellow-400 border border-yellow-400/10 px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:shadow-lg shadow-blue-900/5 active:scale-95 shrink-0"
        >
          <Sparkles className="text-yellow-400" size={14} />
          Quiz de Configuração Rápida
        </button>
      </header>

      {/* Connection & Automation Status Grid */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-inner",
            campaign.status === 'running' && "bg-emerald-50 border-emerald-300 glow-green",
            campaign.status === 'scheduled' && "bg-blue-50 border-blue-300",
            campaign.status === 'paused' && "bg-amber-50 border-amber-300",
            campaign.status === 'stopped' && "bg-red-50 border-red-300",
            campaign.status === 'completed' && "bg-emerald-50 border-emerald-300",
            campaign.status === 'idle' && "bg-slate-50 border-slate-200"
          )}>
            <div className={cn(
              "w-3 h-3 rounded-full transition-colors",
              campaign.status === 'running' && "bg-emerald-500 animate-pulse",
              campaign.status === 'scheduled' && "bg-blue-500 animate-pulse",
              campaign.status === 'paused' && "bg-amber-500",
              campaign.status === 'stopped' && "bg-red-500",
              campaign.status === 'completed' && "bg-emerald-500",
              campaign.status === 'idle' && "bg-slate-400"
            )} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
              Estado da Fila:{' '}
              <span className={cn(
                "capitalize font-black",
                campaign.status === 'running' && "text-emerald-600",
                campaign.status === 'scheduled' && "text-blue-600",
                campaign.status === 'paused' && "text-amber-500",
                campaign.status === 'stopped' && "text-red-500",
                campaign.status === 'completed' && "text-emerald-600",
                campaign.status === 'idle' && "text-slate-400"
              )}>
                {campaign.status === 'running' ? 'Executando disparos' : campaign.status === 'scheduled' ? 'Agendado' : campaign.status}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {campaign.status === 'running' 
                ? `Disparando mensagens: ${campaign.stats.sent} de ${campaign.stats.total} concluídos.`
                : campaign.status === 'scheduled'
                  ? `Campanha persistente agendada para começar em: ${campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString('pt-BR') : ''}`
                  : campaign.contacts.length === 0 
                    ? 'Importe novos destinatários no painel de disparos.'
                    : `Fila carregada com ${campaign.contacts.length} contatos prontos.`
              }
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {campaign.status === 'idle' || campaign.status === 'completed' || campaign.status === 'stopped' ? (
            <button 
              onClick={handleStart}
              disabled={!status.connected || campaign.contacts.length === 0}
              className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-400 font-extrabold px-6 py-3 rounded-xl text-xs transition-all w-full sm:w-auto flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-blue-950/10"
            >
              <Play size={14} fill="currentColor" /> Iniciar Robô de Disparo
            </button>
          ) : campaign.status === 'scheduled' ? (
            <button 
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition-all w-full sm:w-auto flex items-center justify-center gap-2 active:scale-95"
            >
              <Square size={14} fill="currentColor" /> Cancelar Agendamento
            </button>
          ) : (
            <div className="flex gap-2 w-full">
              {campaign.status === 'running' ? (
                <button 
                  onClick={handlePause} 
                  className="bg-amber-400 hover:bg-amber-500 text-blue-950 font-extrabold px-5 py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                >
                  <Pause size={14} fill="currentColor" /> Pausar
                </button>
              ) : (
                <button 
                  onClick={handleResume} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                >
                  <Play size={14} fill="currentColor" /> Retomar
                </button>
              )}
              <button 
                onClick={handleStop} 
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
              >
                <Square size={14} fill="currentColor" /> Parar
              </button>
            </div>
          )}
        </div>
      </section>

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
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delay Mínimo (segundos)</label>
            <input 
              type="number" 
              value={automation.delayMin}
              onChange={(e) => updateAutomation('delayMin', Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
            <span className="text-[9px] text-slate-400">Recomendado mínimo: 15s</span>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delay Máximo (segundos)</label>
            <input 
              type="number" 
              value={automation.delayMax}
              onChange={(e) => updateAutomation('delayMax', Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
            <span className="text-[9px] text-slate-400">Recomendado máximo: 60s</span>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disparos Máx por Hora</label>
            <input 
              type="number" 
              value={automation.maxPerHour}
              onChange={(e) => updateAutomation('maxPerHour', Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
            <span className="text-[9px] text-slate-400">0 = sem limitação horária</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Janela de Início</label>
            <div className="relative">
              <input 
                type="time" 
                value={automation.startTime}
                onChange={(e) => updateAutomation('startTime', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
              />
              <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Janela de Término</label>
            <div className="relative">
              <input 
                type="time" 
                value={automation.endTime}
                onChange={(e) => updateAutomation('endTime', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
              />
              <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disparos Máx por Dia</label>
            <input 
              type="number" 
              value={automation.maxPerDay}
              onChange={(e) => updateAutomation('maxPerDay', Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
            <span className="text-[9px] text-slate-400">0 = sem limitação diária</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* Active Days Selector */}
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-900" />
              Dias Ativos para Envios
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
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Os disparos são pausados automaticamente fora dos dias selecionados acima.</p>
          </div>

          {/* Typing speed selector */}
          <div className="shrink-0">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Velocidade de Digitação</label>
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
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Determina a oscilação da simulação de digitação humana.</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-yellow-400 font-extrabold transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm shadow-blue-900/5"
        >
          <Settings2 size={16} /> Gravar e Aplicar Parâmetros
        </button>
      </section>

      {/* Scheduling Section - Agendar Início dos Disparos */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-900">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950">Agendar Início dos Disparos</h2>
              <p className="text-[11px] text-slate-400 font-medium">Defina uma data e hora para o bot iniciar automaticamente os envios programados.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="datetime-local"
              value={campaign.scheduledAt || ''}
              onChange={(e) => {
                const val = e.target.value;
                setCampaign(prev => ({
                  ...prev,
                  scheduledAt: val || undefined
                }));
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/15 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
            {campaign.scheduledAt && (
              <button 
                onClick={() => setCampaign(prev => ({ ...prev, scheduledAt: undefined }))}
                className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl transition-colors border border-slate-200 active:scale-95"
                title="Limpar agendamento"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {campaign.scheduledAt && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-blue-900">
              Agendado para: {new Date(campaign.scheduledAt).toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </section>

      {/* Anti ban advanced configurations */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-blue-950 flex items-center gap-2 text-base">
            <span className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
              <ShieldCheck size={16} />
            </span>
            Escudo Anti-Banimento Avançado
          </h2>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Proteção Simulação Ativa
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descansar a cada X msgs</label>
            <input 
              type="number" 
              value={automation.pauseEveryX}
              onChange={(e) => updateAutomation('pauseEveryX', Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
            <span className="text-[9px] text-slate-400">Pausa de resfriamento. (Recom: 10-20)</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempo Descanso (minutos)</label>
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
            <span className="text-[9px] text-slate-400">Janela randômica de pausa.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Acúmulo de Fadiga (s)</label>
            <input 
              type="number" 
              step="0.1"
              value={automation.fatigue}
              onChange={(e) => updateAutomation('fatigue', Math.max(0, parseFloat(e.target.value) || 0))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
            <span className="text-[9px] text-slate-400">Adiciona segundos extras de delay por msg.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desvio Aleatório (%)</label>
            <input 
              type="number" 
              value={automation.randomVariation}
              onChange={(e) => updateAutomation('randomVariation', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-slate-800 font-bold"
            />
            <span className="text-[9px] text-slate-400">Percentual de variação oscilatória de delay.</span>
          </div>
        </div>

        <div className="bg-yellow-50/50 border border-yellow-100 rounded-2xl p-4 mt-5 flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-xs font-bold text-slate-850">Diretrizes de Segurança do WhatsApp</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-medium">
              O WhatsApp identifica comportamentos repetitivos como disparos de robôs (spam). As ferramentas de <strong>Desvio Aleatório de Delay</strong> e <strong>Acúmulo de Fadiga</strong> são pilares essenciais de camuflagem, gerando intervalos de espera randômicos e progressivos que simulam a fadiga orgânica de uma pessoa real digitando em tempo real. Mantenha as pausas ativas.
            </p>
          </div>
        </div>
      </section>

      {/* Intelligent setup quiz modal */}
      <AnimatePresence>
        {isQuizOpen && (
          <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative flex flex-col gap-6"
            >
              {/* Close Button */}
              <button 
                onClick={() => { setIsQuizOpen(false); setQuizStep(1); }}
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Progress indicators */}
              <div className="flex gap-2 justify-center">
                {[1, 2, 3].map(step => (
                  <div 
                    key={step} 
                    className={cn(
                      "w-8 h-1.5 rounded-full transition-all duration-300", 
                      quizStep >= step ? "bg-blue-900" : "bg-slate-100"
                    )} 
                  />
                ))}
              </div>

              {/* Step 1: Volume */}
              {quizStep === 1 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                    <Sparkles className="text-yellow-500" size={18} />
                    Qual seu volume diário planejado?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Defina a densidade de disparos. Contas mais novas exigem volumes mais moderados para evitar bloqueios.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    {[
                      { key: 'baixo', label: 'Baixo (Até 50 disparos/dia)', desc: 'Ideal para aquecer chips novos ou números de uso pessoal.' },
                      { key: 'medio', label: 'Médio (50 a 150 disparos/dia)', desc: 'Recomendado. Segurança sólida com boa produtividade diária.' },
                      { key: 'alto', label: 'Alto (Mais de 150 disparos/dia)', desc: 'Requer chips maturados e muito processo de aquecimento prévio.' }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setQuizVolume(opt.key as any)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all hover:bg-slate-50/50",
                          quizVolume === opt.key 
                            ? "border-blue-900 bg-blue-50/30" 
                            : "border-slate-200 bg-slate-50/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{opt.label}</span>
                          {quizVolume === opt.key && <Check size={14} className="text-blue-900" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Scheduling window */}
              {quizStep === 2 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                    <Clock className="text-blue-900" size={18} />
                    Qual a janela de horários ideal?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Restringir envios ao horário comercial é excelente para simular atendimento profissional natural.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    {[
                      { key: 'comercial', label: 'Horário Comercial (08:00 às 18:00)', desc: 'Simula o comportamento de um atendente de suporte humano típico. Mais seguro.' },
                      { key: '24h', label: 'Fluxo Livre (24h de atividade)', desc: 'Sem bloqueios de horário. Dispara a qualquer momento conforme a fila.' }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setQuizHorario(opt.key as any)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all hover:bg-slate-50/50",
                          quizHorario === opt.key 
                            ? "border-blue-900 bg-blue-50/30" 
                            : "border-slate-200 bg-slate-50/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{opt.label}</span>
                          {quizHorario === opt.key && <Check size={14} className="text-blue-900" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Anti ban aggressiveness */}
              {quizStep === 3 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                    <ShieldAlert className="text-red-500" size={18} />
                    Nível de Camuflagem Anti-Ban
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Escolha a blindagem de segurança para simulação de comportamento natural.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    {[
                      { key: 'maxima', label: 'Blindagem Extrema (Altamente Seguro)', desc: 'Delay estendido de 45-90s, pausas constantes a cada 10 envios. Lento, porém seguro.' },
                      { key: 'equilibrada', label: 'Blindagem Balanceada (Recomendado)', desc: 'Delays de 20-50s, pausas inteligentes de 5 a 15 mins. Ótima velocidade/segurança.' },
                      { key: 'rapida', label: 'Blindagem Leve (Envios Rápidos)', desc: 'Delays curtos (8-20s), pausas breves de 2 a 8 mins. Maior rendimento de disparos.' }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setQuizSeguranca(opt.key as any)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all hover:bg-slate-50/50",
                          quizSeguranca === opt.key 
                            ? "border-blue-900 bg-blue-50/30" 
                            : "border-slate-200 bg-slate-50/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{opt.label}</span>
                          {quizSeguranca === opt.key && <Check size={14} className="text-blue-900" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions footer */}
              <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-slate-100">
                {quizStep > 1 && (
                  <button 
                    onClick={() => setQuizStep(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-colors"
                  >
                    Voltar
                  </button>
                )}
                {quizStep < 3 ? (
                  <button 
                    onClick={() => setQuizStep(prev => prev + 1)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-800 text-yellow-400 transition-colors"
                  >
                    Próximo
                  </button>
                ) : (
                  <button 
                    onClick={executeQuizComplete}
                    className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-blue-900 hover:bg-blue-800 text-yellow-400 shadow-md shadow-blue-950/10 transition-colors"
                  >
                    Aplicar Inteligência de Disparos
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
