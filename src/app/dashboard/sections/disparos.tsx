'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, Users, Phone, Upload, Play, Pause, Square, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { socket } from '../../../services/socket';
import { supabase } from '../../../lib/supabase';
import { Contact, Campaign, WhatsAppStatus } from '../../../types';

export default function DisparosSection() {
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({ connected: false, state: 'disconnected' });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState('Olá {nome}, tudo bem?');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<{msg: string, time: Date}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onStatus = (status: WhatsAppStatus) => setWaStatus(status);
    const onCampaignUpdate = (camp: Campaign) => setCampaign(camp);
    const onLog = (log: any) => setLogs(prev => [...prev, { msg: log.message, time: new Date(log.timestamp) }].slice(-50));
    
    socket.on('whatsapp-status', onStatus);
    socket.on('campaign-update', onCampaignUpdate);
    socket.on('log', onLog);
    
    socket.emit('get-whatsapp-status');

    return () => {
      socket.off('whatsapp-status', onStatus);
      socket.off('campaign-update', onCampaignUpdate);
      socket.off('log', onLog);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Erro ao enviar arquivo CSV');
    }
  };

  const startCampaign = async () => {
    if (contacts.length === 0) return alert('Importe contatos primeiro');
    if (!message) return alert('Digite uma mensagem');
    if (!supabase) return alert('Supabase não configurado');

    const { data: { user } } = await supabase.auth.getUser();
    
    // Buscar configurações de automação do usuário
    let automation = undefined;
    
    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      message,
      contacts: contacts.map(c => ({ ...c, status: 'pending' })),
      delayMin: 10,
      delayMax: 20,
      status: 'idle',
      stats: { sent: 0, error: 0, total: contacts.length, pending: contacts.length },
      automation
    };

    socket.emit('start-campaign', newCampaign);
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy-950 tracking-tight">Gerenciador de Disparos</h1>
        <p className="text-slate-500 mt-2 font-medium">Crie campanhas e acompanhe envios em tempo real.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Setup */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status WhatsApp */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${waStatus.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-navy-950">Status da Conexão</h3>
                <p className="text-sm font-medium text-slate-500">
                  {waStatus.connected ? `Conectado como ${waStatus.name || waStatus.number}` : 'Aguardando leitura do QR Code'}
                </p>
              </div>
            </div>
            {!waStatus.connected && waStatus.qr && (
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                 {/* Exibir QR Code (requer QRCode library no frontend, simplificado aqui) */}
                 <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-center p-2 rounded-lg text-slate-400">
                   QR Code Aqui
                 </div>
              </div>
            )}
            {waStatus.connected && (
              <button 
                onClick={() => socket.emit('whatsapp-logout')}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
              >
                Desconectar
              </button>
            )}
          </div>

          {/* Import Contacts */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-navy-950 mb-4 flex items-center gap-2">
              <Users size={20} className="text-gold-500" />
              Contatos da Campanha ({contacts.length})
            </h3>
            
            <div className="flex gap-3 mb-4">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-navy-50 hover:bg-navy-100 text-navy-900 font-bold py-3 rounded-xl transition-colors border border-navy-100"
              >
                <Upload size={18} />
                Importar CSV
              </button>
              <button 
                onClick={() => setContacts([])}
                className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors border border-slate-200"
              >
                Limpar
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-2">
              {contacts.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-4 font-medium">Nenhum contato importado</p>
              ) : (
                <div className="space-y-1">
                  {contacts.slice(0, 50).map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-2 hover:bg-white rounded-lg text-sm">
                      <span className="font-semibold text-navy-900">{c.name}</span>
                      <span className="text-slate-500 font-medium">{c.number}</span>
                    </div>
                  ))}
                  {contacts.length > 50 && (
                    <p className="text-center text-xs text-slate-400 font-bold mt-2 pt-2 border-t border-slate-200">
                      + {contacts.length - 50} contatos ocultos
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message Composer */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-navy-950 mb-4 flex items-center gap-2">
              <Send size={20} className="text-gold-500" />
              Mensagem
            </h3>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setMessage(prev => prev + '{nome}')} className="px-3 py-1.5 bg-navy-50 text-navy-900 text-xs font-bold rounded-lg hover:bg-navy-100 transition-colors">
                + Nome
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 outline-none transition-all resize-none text-sm font-medium text-navy-950"
              placeholder="Digite sua mensagem aqui..."
            />
          </div>

        </div>

        {/* Right Column: Execution & Logs */}
        <div className="space-y-6">
          
          {/* Controls */}
          <div className="bg-navy-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-400/10 to-transparent"></div>
            <h3 className="font-black text-xl mb-6 relative z-10">Controle de Disparo</h3>
            
            <div className="space-y-4 relative z-10">
              {(!campaign || ['idle', 'completed', 'stopped'].includes(campaign.status)) ? (
                <button 
                  onClick={startCampaign}
                  disabled={!waStatus.connected || contacts.length === 0}
                  className="w-full py-4 bg-gold-400 hover:bg-gold-500 text-navy-950 font-black rounded-xl transition-all shadow-lg shadow-gold-500/20 flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:bg-gold-400 active:scale-[0.98]"
                >
                  <Play size={20} />
                  Iniciar Campanha
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {campaign.status === 'running' ? (
                    <button onClick={() => socket.emit('pause-campaign')} className="py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-colors">
                      <Pause size={18} /> Pausar
                    </button>
                  ) : (
                    <button onClick={() => socket.emit('resume-campaign')} className="py-3 bg-gold-400 hover:bg-gold-500 text-navy-950 font-bold rounded-xl flex justify-center items-center gap-2 transition-colors">
                      <Play size={18} /> Retomar
                    </button>
                  )}
                  <button onClick={() => socket.emit('stop-campaign')} className="py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl flex justify-center items-center gap-2 transition-colors">
                    <Square size={18} /> Parar
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            {campaign && (
              <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                <div className="flex justify-between text-xs font-bold text-navy-200 mb-2 uppercase tracking-wider">
                  <span>Progresso</span>
                  <span>{campaign.stats.sent} / {campaign.stats.total}</span>
                </div>
                <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden mb-6">
                  <div 
                    className="h-full bg-gold-400 rounded-full transition-all duration-500" 
                    style={{ width: `${(campaign.stats.sent / campaign.stats.total) * 100}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-navy-300 uppercase">Sucesso</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">{campaign.stats.sent}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-navy-300 uppercase">Erros</p>
                    <p className="text-xl font-black text-red-400 mt-1">{campaign.stats.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Logs Terminal */}
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl h-80 flex flex-col font-mono">
            <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2 mb-4 shrink-0">
              <Clock size={16} />
              Logs do Sistema
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {logs.length === 0 ? (
                <p className="text-slate-600 italic">Aguardando início...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-3 border-b border-slate-800/50 pb-2">
                    <span className="text-slate-500 shrink-0">[{log.time.toLocaleTimeString()}]</span>
                    <span className="text-slate-300 break-words">{log.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
