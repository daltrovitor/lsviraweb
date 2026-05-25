'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Send,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../../utils/supabase';
import { socket } from '../../../services/socket';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    sent: 0,
    successRate: 0,
    extracted: 0,
    speed: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar leads extraídos
      const { data: leads } = await supabase
        .from('scraped_leads')
        .select('id, search_id!inner(user_id)')
        .eq('search_id.user_id', user.id);
      
      const totalExtracted = leads?.length || 0;

      // Buscar status de campanhas (mock data until connected properly)
      setStats({
        sent: 1420,
        successRate: 98.5,
        extracted: totalExtracted,
        speed: 45
      });
    };
    
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Mensagens Enviadas', value: stats.sent.toLocaleString(), icon: Send, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { label: 'Taxa de Sucesso', value: `${stats.successRate}%`, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { label: 'Leads Extraídos', value: stats.extracted.toLocaleString(), icon: Users, color: 'bg-gold-50 text-gold-600 border-gold-200' },
    { label: 'Velocidade Média', value: `${stats.speed}/min`, icon: Zap, color: 'bg-navy-50 text-navy-600 border-navy-200' },
  ];

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy-950 tracking-tight">Painel de Controle</h1>
        <p className="text-slate-500 mt-2 font-medium">Acompanhe seus disparos e extrações em tempo real.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
              </div>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-black text-navy-950 mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Getting Started */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-black text-navy-950 mb-6 flex items-center gap-2">
            <Zap className="text-gold-500" size={24} />
            Como Começar
          </h2>
          <ol className="space-y-4">
            {[
              'Extraia contatos no Maps Scraper ou importe um CSV',
              'Configure os parâmetros anti-ban na Automação',
              'Crie uma nova campanha em Disparos',
              'Acompanhe o progresso em tempo real',
            ].map((step, idx) => (
              <li key={idx} className="text-sm text-slate-600 flex items-center gap-3 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-navy-900 text-gold-400 font-black flex items-center justify-center shrink-0 shadow-sm">
                  {idx + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Activity Chart Area */}
        <div className="bg-navy-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-gold-400" size={24} />
              <h2 className="text-xl font-black">Atividade Recente</h2>
            </div>
            
            <div className="h-48 flex items-end justify-between gap-2 mt-8">
              {[40, 70, 45, 90, 65, 80, 100].map((height, i) => (
                <div key={i} className="w-full relative group">
                  <div 
                    className="w-full bg-blue-500/20 hover:bg-gold-400/80 rounded-t-lg transition-colors cursor-pointer relative"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-navy-900 text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {height * 10}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-navy-200 mt-3 font-bold uppercase tracking-wider">
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sab</span>
              <span>Dom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
