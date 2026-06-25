'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Send,
  Zap,
  CheckCircle2,
  AlertCircle,
  Phone,
  PhoneOff,
  RefreshCw,
  Loader2,
  Pause,
  Play,
  Square
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { fetchUserProfile } from '../../../lib/profile';
import { socket } from '../../../services/socket';
import { WhatsAppStatus, Campaign } from '../../../types';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    sent: 0,
    successRate: 100,
    extracted: 0,
    speed: 0,
    templatesSaved: 0,
    campaignsTotal: 0,
    campaignsActive: 0,
    campaignsPaused: 0
  });

  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({ connected: false, state: 'disconnected' });
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Guardar estatísticas base do banco de dados para somar com atualizações do Socket
  const dbStatsRef = useRef({ sent: 0, error: 0 });

  const fetchStatsAndProfile = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profile = await fetchUserProfile(user);
      setUserProfile(profile);

      // Buscar leads extraídos
      const { data: leads } = await supabase
        .from('scraped_leads')
        .select('id, scraped_searches!inner(user_id)')
        .eq('scraped_searches.user_id', user.id);
      const totalExtracted = leads?.length || 0;

      // Buscar templates
      const { count: templatesCount } = await supabase
        .from('message_templates')
        .select('id', { count: 'exact', head: true });

      // Buscar campanhas do usuário para calcular histórico de disparos
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('sent_count, error_count, status')
        .eq('user_id', user.id);

      let dbSent = 0;
      let dbError = 0;
      let campaignsActive = 0;
      let campaignsPaused = 0;

      if (campaigns) {
        campaigns.forEach(c => {
          if (c.status === 'completed' || c.status === 'stopped' || c.status === 'idle' || c.status === 'draft') {
            dbSent += c.sent_count || 0;
            dbError += c.error_count || 0;
          }
          if (c.status === 'running') campaignsActive++;
          if (c.status === 'paused') campaignsPaused++;
        });
      }

      dbStatsRef.current = { sent: dbSent, error: dbError };

      if (activeCampaign) {
        if (activeCampaign.status === 'running') campaignsActive = 1;
        if (activeCampaign.status === 'paused') campaignsPaused = 1;
      }

      const totalSent = dbSent + (activeCampaign?.stats.sent || 0);
      const totalError = dbError + (activeCampaign?.stats.error || 0);
      const totalAttempts = totalSent + totalError;
      const successRate = totalAttempts > 0 ? parseFloat(((totalSent / totalAttempts) * 100).toFixed(1)) : 100;

      setStats({
        sent: totalSent,
        successRate: successRate,
        extracted: totalExtracted,
        speed: activeCampaign?.status === 'running' ? Math.round(60 / ((activeCampaign.delayMin + activeCampaign.delayMax) / 2)) : 0,
        templatesSaved: templatesCount || 0,
        campaignsTotal: campaigns?.length || 0,
        campaignsActive,
        campaignsPaused
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas reais:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStatsAndProfile();

    // Sockets
    const onStatus = (status: WhatsAppStatus) => {
      setWaStatus(status);
    };

    const onCampaignUpdate = (camp: Campaign) => {
      setActiveCampaign(camp);
      
      const totalSent = dbStatsRef.current.sent + (camp?.stats?.sent || 0);
      const totalError = dbStatsRef.current.error + (camp?.stats?.error || 0);
      const totalAttempts = totalSent + totalError;
      const successRate = totalAttempts > 0 ? parseFloat(((totalSent / totalAttempts) * 100).toFixed(1)) : 100;
      
      setStats(prev => {
        let active = prev.campaignsActive;
        let paused = prev.campaignsPaused;
        if (camp.status === 'running') {
          active = 1;
          paused = 0;
        } else if (camp.status === 'paused') {
          active = 0;
          paused = 1;
        } else {
          active = 0;
          paused = 0;
        }
        return {
          ...prev,
          sent: totalSent,
          successRate: successRate,
          speed: camp.status === 'running' ? Math.round(60 / ((camp.delayMin + camp.delayMax) / 2)) : 0,
          campaignsActive: active,
          campaignsPaused: paused
        };
      });
    };

    socket.on('whatsapp-status', onStatus);
    socket.on('campaign-update', onCampaignUpdate);
    
    socket.emit('get-whatsapp-status');
    socket.emit('get-campaign-status');

    return () => {
      socket.off('whatsapp-status', onStatus);
      socket.off('campaign-update', onCampaignUpdate);
    };
  }, []);

  const statCards = [
    { label: 'Msgs Enviadas / Salvas', value: `${stats.sent.toLocaleString()} / ${stats.templatesSaved}`, icon: Send, color: 'bg-v-blue-400/10 text-v-blue-500 border-v-blue-400/20' },
    { label: 'Campanhas (Ativas/Pausadas/Total)', value: `${stats.campaignsActive} / ${stats.campaignsPaused} / ${stats.campaignsTotal}`, icon: Zap, color: 'bg-navy-50 text-navy-900 border-navy-200' },
    { label: 'Leads Extraídos', value: stats.extracted.toLocaleString(), icon: Users, color: 'bg-gold-400/10 text-gold-500 border-gold-400/20' },
    { label: 'Taxa de Sucesso', value: `${stats.successRate}%`, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  ];

  return (
    <div className="p-4 md:p-8 animate-fade-in premium-bg min-h-screen">
      {/* Greeting */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">
            Olá, <span className="text-v-blue-500">{userProfile?.full_name?.split(' ')[0] || 'Usuário'}</span> 👋
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Acompanhe suas captações e disparos em tempo real.</p>
        </div>
        <button 
          onClick={() => { setLoadingStats(true); fetchStatsAndProfile(); }}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} className={loadingStats ? "animate-spin" : ""} />
          Atualizar Dados
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Side: Stats and Activity */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Stats */}
          {loadingStats ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-pulse h-32"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-black text-navy-900 mt-1">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Campaign Live Widget */}
          <AnimatePresence>
            {activeCampaign && ['running', 'paused', 'scheduled'].includes(activeCampaign.status) && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-navy-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-v-blue-500/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-gold-400 text-navy-950 px-2 py-0.5 rounded-full">
                        Campanha Ativa
                      </span>
                      <h3 className="font-black text-lg mt-1 truncate max-w-md">
                        {activeCampaign.message.slice(0, 50)}...
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-navy-300 capitalize bg-white/10 px-3 py-1 rounded-lg">
                      {activeCampaign.status === 'running' ? 'Enviando...' : activeCampaign.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-navy-200 mb-2">
                      <span>Progresso dos Disparos</span>
                      <span>{activeCampaign.stats.sent} / {activeCampaign.stats.total}</span>
                    </div>
                    <div className="w-full h-3 bg-navy-800 rounded-full overflow-hidden mb-6">
                      <div 
                        className="h-full bg-gradient-to-r from-v-blue-400 to-gold-400 rounded-full transition-all duration-500" 
                        style={{ width: `${(activeCampaign.stats.sent / activeCampaign.stats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-navy-300 uppercase tracking-wider">Sucesso</p>
                      <p className="text-xl font-black text-emerald-400 mt-1">{activeCampaign.stats.sent}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-navy-300 uppercase tracking-wider">Falhas</p>
                      <p className="text-xl font-black text-red-400 mt-1">{activeCampaign.stats.error}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-navy-300 uppercase tracking-wider">Ações</p>
                      <div className="flex gap-2 mt-1">
                        {activeCampaign.status === 'running' ? (
                          <button onClick={() => socket.emit('pause-campaign')} className="p-1 bg-white/10 hover:bg-white/20 rounded text-white transition-colors" title="Pausar">
                            <Pause size={16} />
                          </button>
                        ) : (
                          <button onClick={() => socket.emit('resume-campaign')} className="p-1 bg-gold-400 hover:bg-gold-500 rounded text-navy-950 transition-colors" title="Retomar">
                            <Play size={16} />
                          </button>
                        )}
                        <button onClick={() => socket.emit('stop-campaign')} className="p-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors" title="Parar">
                          <Square size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activity Chart Area */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-v-blue-500" size={24} />
              <h2 className="text-xl font-black text-navy-900">Atividade Recente</h2>
            </div>
            
            <div className="h-48 flex items-end justify-between gap-3 mt-8">
              {[40, 70, 45, 90, 65, 80, 100].map((height, i) => (
                <div key={i} className="w-full relative group">
                  <div 
                    className="w-full bg-v-blue-400/20 hover:bg-v-blue-500 rounded-t-xl transition-colors cursor-pointer relative"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                      {Math.round(height * 2.5)} envios
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-wider">
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

        {/* Right Side: WhatsApp QR Code & Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* WhatsApp QR Code Widget */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <h3 className="font-bold text-navy-900 text-lg mb-2">WhatsApp Web</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Conexão do celular para automações de disparo.</p>

            <AnimatePresence mode="wait">
              {waStatus.connected ? (
                <motion.div 
                  key="connected"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full flex flex-col items-center py-4"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
                    <Phone size={36} />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Conectado
                  </span>
                  {waStatus.number && (
                    <p className="text-sm font-bold text-navy-900">
                      {waStatus.name ? `${waStatus.name}` : ''} ({waStatus.number})
                    </p>
                  )}
                  <p className="text-xs text-slate-400 font-medium mt-1">Pronto para disparar campanhas</p>

                  <button 
                    onClick={() => socket.emit('whatsapp-logout')}
                    className="mt-6 w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-colors border border-red-200"
                  >
                    Desconectar WhatsApp
                  </button>
                </motion.div>
              ) : waStatus.state === 'qrcode' && waStatus.qr ? (
                <motion.div 
                  key="qrcode"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-v-blue-400/30 shadow-inner mb-4">
                    <QRCodeSVG value={waStatus.qr} size={180} includeMargin={true} />
                  </div>
                  
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-4 animate-pulse">
                    Aguardando Leitura
                  </span>

                  <ol className="text-[11px] text-slate-500 space-y-2 text-left w-full px-2 border-t border-slate-100 pt-4">
                    <li className="font-medium flex gap-2"><span className="font-bold text-v-blue-500">1.</span> Abra o WhatsApp no seu celular</li>
                    <li className="font-medium flex gap-2"><span className="font-bold text-v-blue-500">2.</span> Vá em Aparelhos Conectados</li>
                    <li className="font-medium flex gap-2"><span className="font-bold text-v-blue-500">3.</span> Toque em Conectar Aparelho</li>
                    <li className="font-medium flex gap-2"><span className="font-bold text-v-blue-500">4.</span> Aponte a câmera para este QR Code</li>
                  </ol>
                </motion.div>
              ) : (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center py-10"
                >
                  <Loader2 size={32} className="text-v-blue-500 animate-spin mb-4" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">
                    Conectando ao WhatsApp...
                  </span>
                  <p className="text-[10px] text-slate-400 mt-2 max-w-[200px] leading-relaxed">
                    Se o QR Code demorar a carregar, certifique-se que o backend está rodando e clique abaixo para tentar novamente.
                  </p>
                  <button 
                    onClick={() => socket.emit('get-whatsapp-status')}
                    className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={14} /> Forçar Atualização
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Guide */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-md font-black text-navy-900 mb-4 flex items-center gap-2">
              <Zap className="text-gold-500" size={18} />
              Como Começar
            </h2>
            <ol className="space-y-3">
              {[
                'Extraia contatos no Maps Scraper ou importe um CSV',
                'Configure os parâmetros anti-ban na Automação',
                'Crie uma nova campanha em Disparos',
                'Acompanhe o progresso em tempo real',
              ].map((step, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-center gap-3 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-navy-900 text-gold-400 font-black flex items-center justify-center shrink-0 shadow-sm text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
