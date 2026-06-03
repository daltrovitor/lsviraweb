'use client';

import { useState } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Send,
  Zap
} from 'lucide-react';

export default function DashboardHome() {
  const stats = [
    { label: 'Mensagens Enviadas', value: '0', icon: Send, color: 'bg-blue-50 text-blue-900' },
    { label: 'Taxa de Sucesso', value: '0%', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-900' },
    { label: 'Contatos Importados', value: '0', icon: Users, color: 'bg-purple-50 text-purple-900' },
    { label: 'Velocidade Média', value: '0/min', icon: Zap, color: 'bg-yellow-50 text-yellow-900' },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-blue-950">Bem-vindo ao LeadScrap</h1>
        <p className="text-slate-500 mt-2">Bot inteligente de disparos em massa para WhatsApp com proteção anti-ban</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                <Icon size={24} />
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-black text-blue-950 mt-2">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Getting Started */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-black text-blue-950 mb-4 flex items-center gap-2">
            <Zap className="text-yellow-500" size={24} />
            Como Começar
          </h2>
          <ol className="space-y-3">
            {[
              '1. Extraia contatos de grupos ou importe um CSV',
              '2. Configure os parâmetros de automação',
              '3. Clique em "Iniciar Robô de Disparo"',
              '4. Acompanhe o progresso em tempo real',
            ].map((step, idx) => (
              <li key={idx} className="text-sm text-slate-600 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-xs">
                  {idx + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Features */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-black text-blue-950 mb-4 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={24} />
            Funcionalidades Principais
          </h2>
          <ul className="space-y-3">
            {[
              '✅ Extração automática de grupos WhatsApp',
              '✅ Scraping de dados no Google Maps',
              '✅ Proteção anti-ban com simulação humana',
              '✅ Agendamento de campanhas',
              '✅ Relatórios detalhados',
              '✅ Suporte a imagem e vídeo',
            ].map((feature, idx) => (
              <li key={idx} className="text-sm text-slate-600">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white rounded-3xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={24} />
          <h2 className="text-xl font-black">Status Geral do Sistema</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-blue-200 text-xs uppercase font-semibold tracking-wide">WhatsApp</p>
            <p className="text-2xl font-black text-yellow-400 mt-1">Desconectado</p>
            <p className="text-blue-300 text-xs mt-1">Conecte sua conta para começar</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs uppercase font-semibold tracking-wide">Banco de Dados</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">Ativo</p>
            <p className="text-blue-300 text-xs mt-1">Supabase conectado</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs uppercase font-semibold tracking-wide">Último Disparo</p>
            <p className="text-2xl font-black text-blue-300 mt-1">--</p>
            <p className="text-blue-300 text-xs mt-1">Nenhum ainda</p>
          </div>
        </div>
      </div>
    </div>
  );
}
