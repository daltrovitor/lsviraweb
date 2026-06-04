'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Send,
  Users,
  Zap,
  CheckCircle2,
  TrendingUp,
  Phone,
  RefreshCw,
  Pause,
  Play,
  Square,
  Loader2,
  MapPin,
  Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { fetchUserProfile } from '@/lib/profile';
import { socket } from '@/services/socket';
import { WhatsAppStatus, Campaign } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const QR_STEPS = [
  'Abra o WhatsApp no celular',
  'Toque em Aparelhos conectados',
  'Selecione Conectar aparelho',
  'Aponte a câmera para o QR Code',
];

export function DashboardHomeModule() {
  const [stats, setStats] = useState({ sent: 0, successRate: 100, extracted: 0, speed: 0 });
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({ connected: false, state: 'disconnected' });
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [userName, setUserName] = useState('Usuário');
  const dbStatsRef = useRef({ sent: 0, error: 0 });

  const fetchStats = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profile = await fetchUserProfile(user);
      setUserName(profile.full_name?.split(' ')[0] || 'Usuário');

      const { data: leads } = await supabase
        .from('scraped_leads')
        .select('id, scraped_searches!inner(user_id)')
        .eq('scraped_searches.user_id', user.id);

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('sent_count, error_count, status')
        .eq('user_id', user.id);

      let dbSent = 0;
      let dbError = 0;
      campaigns?.forEach((c) => {
        if (['completed', 'stopped', 'idle'].includes(c.status)) {
          dbSent += c.sent_count || 0;
          dbError += c.error_count || 0;
        }
      });

      dbStatsRef.current = { sent: dbSent, error: dbError };
      const totalSent = dbSent + (activeCampaign?.stats.sent || 0);
      const totalError = dbError + (activeCampaign?.stats.error || 0);
      const totalAttempts = totalSent + totalError;

      setStats({
        sent: totalSent,
        successRate: totalAttempts > 0 ? parseFloat(((totalSent / totalAttempts) * 100).toFixed(1)) : 100,
        extracted: leads?.length || 0,
        speed:
          activeCampaign?.status === 'running'
            ? Math.round(60 / ((activeCampaign.delayMin + activeCampaign.delayMax) / 2))
            : 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const onStatus = (s: WhatsAppStatus) => setWaStatus(s);
    const onCampaign = (camp: Campaign) => {
      setActiveCampaign(camp);
      const totalSent = dbStatsRef.current.sent + (camp?.stats?.sent || 0);
      const totalError = dbStatsRef.current.error + (camp?.stats?.error || 0);
      const totalAttempts = totalSent + totalError;
      setStats((prev) => ({
        ...prev,
        sent: totalSent,
        successRate: totalAttempts > 0 ? parseFloat(((totalSent / totalAttempts) * 100).toFixed(1)) : 100,
        speed:
          camp.status === 'running' ? Math.round(60 / ((camp.delayMin + camp.delayMax) / 2)) : 0,
      }));
    };

    socket.on('whatsapp-status', onStatus);
    socket.on('campaign-update', onCampaign);
    socket.emit('get-whatsapp-status');

    return () => {
      socket.off('whatsapp-status', onStatus);
      socket.off('campaign-update', onCampaign);
    };
  }, []);

  const statCards = [
    { label: 'Enviadas', value: stats.sent.toLocaleString(), icon: Send },
    { label: 'Sucesso', value: `${stats.successRate}%`, icon: CheckCircle2 },
    { label: 'Leads', value: stats.extracted.toLocaleString(), icon: Users },
    { label: 'Velocidade', value: stats.speed > 0 ? `${stats.speed}/min` : '—', icon: Zap },
  ];

  const showQr = !waStatus.connected && waStatus.state === 'qrcode' && waStatus.qr;

  return (
    <div className="space-y-8">
      {/* Header compacto */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-v-blue-600 uppercase tracking-widest mb-1">Command Center</p>
          <h1 className="text-2xl md:text-3xl font-black text-gradient-tech tracking-tight">
            Olá, {userName}
          </h1>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setLoadingStats(true);
            fetchStats();
            socket.emit('get-whatsapp-status');
          }}
        >
          <RefreshCw size={14} className={loadingStats ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      {/* Hero: conexão WhatsApp / QR Code */}
      <Card glow className="overflow-hidden !p-0">
        <div className="grid lg:grid-cols-2">
          {/* Lado esquerdo: info + passos */}
          <div className="p-6 md:p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-100/80 bg-gradient-to-br from-white to-slate-50/80">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-v-blue-500/10 border border-v-blue-400/25 flex items-center justify-center">
                <Smartphone className="text-v-blue-600" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-navy-950">Conectar WhatsApp</h2>
                <p className="text-xs text-slate-500 font-medium">Necessário para disparos e grupos</p>
              </div>
            </div>

            {waStatus.connected ? (
              <div className="space-y-4">
                <Badge variant="success" pulse>
                  Conectado
                </Badge>
                <p className="text-sm font-bold text-navy-900">
                  {waStatus.name || waStatus.number || 'Sessão ativa'}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Seu número está pronto para campanhas, extração de grupos e automações.
                </p>
                <Button variant="danger" className="w-full sm:w-auto" onClick={() => socket.emit('whatsapp-logout')}>
                  Desconectar WhatsApp
                </Button>
              </div>
            ) : showQr ? (
              <div className="space-y-4">
                <Badge variant="warning" pulse>
                  Aguardando leitura do QR
                </Badge>
                <ol className="space-y-2.5">
                  {QR_STEPS.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                      <span className="w-6 h-6 shrink-0 rounded-lg bg-navy-900 text-gold-400 text-[10px] font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 size={18} className="animate-spin text-v-blue-500" />
                  <span className="text-sm font-bold">Gerando QR Code…</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Se demorar, confirme que o servidor está rodando e clique em atualizar.
                </p>
                <Button variant="outline" onClick={() => socket.emit('get-whatsapp-status')}>
                  <RefreshCw size={14} /> Forçar atualização
                </Button>
              </div>
            )}
          </div>

          {/* Lado direito: QR grande ou estado conectado */}
          <div className="p-6 md:p-10 flex items-center justify-center min-h-[320px] bg-gradient-to-br from-slate-50/50 to-v-blue-500/5">
            <AnimatePresence mode="wait">
              {waStatus.connected ? (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-28 h-28 mx-auto rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
                    <Phone size={48} />
                  </div>
                  <p className="mt-6 text-sm font-bold text-navy-900">WhatsApp Online</p>
                  <p className="text-xs text-slate-500 mt-1">Pronto para operar</p>
                </motion.div>
              ) : showQr ? (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="relative inline-block">
                    <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-v-blue-400/20 via-gold-400/15 to-v-blue-400/20 blur-sm" />
                    <div className="relative p-4 bg-white rounded-2xl border-2 border-dashed border-v-blue-400/50 shadow-xl shadow-v-blue-500/10">
                      <QRCodeSVG value={waStatus.qr!} size={220} level="M" includeMargin />
                    </div>
                  </div>
                  <p className="mt-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Escaneie com seu celular
                  </p>
                </motion.div>
              ) : (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <div className="w-48 h-48 mx-auto rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 flex items-center justify-center">
                    <Loader2 size={40} className="text-v-blue-500 animate-spin" />
                  </div>
                  <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Preparando QR Code
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>

      {/* KPIs compactos */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3 border border-white/80"
              >
                <div className="w-9 h-9 rounded-lg bg-v-blue-500/10 flex items-center justify-center text-v-blue-600 shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {stat.label}
                  </p>
                  <p className="text-lg font-black text-navy-950">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Segunda linha: campanha + gráfico + atalhos */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence>
            {activeCampaign && ['running', 'paused', 'scheduled'].includes(activeCampaign.status) && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card variant="dark" glow>
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                    <div>
                      <Badge variant="gold" pulse>
                        Campanha ativa
                      </Badge>
                      <p className="font-bold text-white mt-2 text-sm line-clamp-2">
                        {activeCampaign.message.slice(0, 80)}…
                      </p>
                    </div>
                    <Badge variant="live">{activeCampaign.status}</Badge>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>Progresso</span>
                    <span>
                      {activeCampaign.stats.sent} / {activeCampaign.stats.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={activeCampaign.stats.sent}
                    max={activeCampaign.stats.total}
                    className="mb-4 bg-white/10"
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Sucesso </span>
                      <span className="text-lg font-black text-emerald-400">{activeCampaign.stats.sent}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Falhas </span>
                      <span className="text-lg font-black text-red-400">{activeCampaign.stats.error}</span>
                    </div>
                    <div className="flex gap-2 ml-auto">
                      {activeCampaign.status === 'running' ? (
                        <button
                          onClick={() => socket.emit('pause-campaign')}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                        >
                          <Pause size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => socket.emit('resume-campaign')}
                          className="p-2 rounded-lg bg-gold-400 text-navy-950"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => socket.emit('stop-campaign')}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400"
                      >
                        <Square size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card>
            <div className="flex items-center gap-3 mb-5">
              <TrendingUp className="text-v-blue-500" size={20} />
              <h2 className="text-base font-black text-navy-950">Atividade semanal</h2>
            </div>
            <div className="h-36 flex items-end justify-between gap-2">
              {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                <div key={i} className="flex-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-v-blue-500/25 to-v-blue-400/55 transition-all"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="h-full">
            <h3 className="font-bold text-navy-950 mb-1 flex items-center gap-2">
              <Zap className="text-gold-500" size={18} />
              Ações rápidas
            </h3>
            <p className="text-xs text-slate-500 mb-4">Após conectar o WhatsApp</p>
            <div className="space-y-2">
              <Link
                href="/maps"
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-v-blue-500/5 border border-slate-100 hover:border-v-blue-400/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-v-blue-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MapPin size={18} className="text-v-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-900">Extração Maps</p>
                  <p className="text-[11px] text-slate-500">Captar novos leads</p>
                </div>
              </Link>
              <Link
                href="/disparos"
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-gold-400/10 border border-slate-100 hover:border-gold-400/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gold-400/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Send size={18} className="text-gold-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-900">Novo disparo</p>
                  <p className="text-[11px] text-slate-500">Enviar campanha</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
