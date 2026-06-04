'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Users, Phone, Upload, Play, Pause, Square, MapPin, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from '@/services/socket';
import { supabase } from '@/lib/supabase';
import { Contact, Campaign, WhatsAppStatus } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { LogTerminal, LogEntry } from '@/components/ui/log-terminal';
import { loadAutomationFromStorage } from '@/lib/automation-storage';

export function DisparosModule() {
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({ connected: false, state: 'disconnected' });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [message, setMessage] = useState('Olá {nome}, tudo bem?');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onStatus = (s: WhatsAppStatus) => setWaStatus(s);
    const onCamp = (c: Campaign) => setCampaign(c);
    const onLog = (log: { message: string; timestamp: Date }) =>
      setLogs((prev) => [...prev, { msg: log.message, time: new Date(log.timestamp) }].slice(-50));

    socket.on('whatsapp-status', onStatus);
    socket.on('campaign-update', onCamp);
    socket.on('log', onLog);
    socket.emit('get-whatsapp-status');

    // Carrega contatos pendentes do localStorage importados da página do Maps
    const pendingContacts = localStorage.getItem('ls_pending_imported_contacts');
    if (pendingContacts) {
      try {
        const parsed = JSON.parse(pendingContacts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setContacts(parsed);
          localStorage.removeItem('ls_pending_imported_contacts');
        }
      } catch (err) {
        console.error('Erro ao ler contatos importados do Maps:', err);
      }
    }

    return () => {
      socket.off('whatsapp-status', onStatus);
      socket.off('campaign-update', onCamp);
      socket.off('log', onLog);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-csv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) setContacts(data.contacts);
      else alert(data.error);
    } catch {
      alert('Erro ao enviar CSV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const importFromMapsScrape = async () => {
    if (!supabase) return alert('Supabase não configurado');
    setLoadingLeads(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('scraped_leads')
        .select('title, phone, scraped_searches!inner(user_id)')
        .eq('scraped_searches.user_id', user.id);

      if (error) throw error;
      if (!data || data.length === 0) {
        alert('Nenhum lead encontrado no histórico do Google Maps.');
        return;
      }

      // Sanitizar e converter em contatos
      const sanitizeWhatsAppNumber = (num: string): string => {
        const clean = num.replace(/\D/g, '');
        if (clean.length === 0) return '';
        if (clean.length >= 12 && clean.startsWith('55')) return clean;
        if (clean.length >= 10 && clean.length <= 11) return '55' + clean;
        return clean;
      };

      const mappedContacts: Contact[] = data
        .map((lead: any) => {
          const cleanNum = sanitizeWhatsAppNumber(lead.phone);
          if (!cleanNum) return null;
          return {
            name: lead.title || 'Sem nome',
            number: cleanNum,
          };
        })
        .filter(Boolean) as Contact[];

      // Remover duplicados por número
      const uniqueContacts: Contact[] = [];
      const numbersSeen = new Set<string>();
      for (const c of mappedContacts) {
        if (!numbersSeen.has(c.number)) {
          numbersSeen.add(c.number);
          uniqueContacts.push(c);
        }
      }

      if (uniqueContacts.length === 0) {
        alert('Nenhum contato com número válido foi encontrado nos leads salvos.');
        return;
      }

      setContacts(uniqueContacts);
      alert(`${uniqueContacts.length} contatos carregados com sucesso do histórico do Google Maps!`);
    } catch (err: any) {
      console.error('Erro ao carregar leads do Maps:', err);
      alert(`Falha ao carregar leads: ${err.message}`);
    } finally {
      setLoadingLeads(false);
    }
  };

  const startCampaign = () => {
    if (contacts.length === 0) return alert('Importe contatos primeiro');
    if (!message.trim()) return alert('Digite uma mensagem');
    if (!waStatus.connected) return alert('Conecte o WhatsApp primeiro');

    const automation = loadAutomationFromStorage();
    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      message,
      contacts: contacts.map((c) => ({ ...c, status: 'pending' as const })),
      delayMin: automation.delayMin,
      delayMax: automation.delayMax,
      status: 'idle',
      stats: { sent: 0, error: 0, total: contacts.length, pending: contacts.length },
      automation,
    };

    socket.emit('start-campaign', newCampaign);
  };

  const idle = !campaign || ['idle', 'completed', 'stopped'].includes(campaign.status);

  return (
    <div>
      <PageHeader
        title="Gerenciador de Disparos"
        description="Crie campanhas, importe contatos e acompanhe envios em tempo real."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  waStatus.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}
              >
                <Phone size={22} />
              </div>
              <div>
                <CardTitle className="!mb-0">Conexão WhatsApp</CardTitle>
                <p className="text-sm text-slate-500 font-medium">
                  {waStatus.connected
                    ? `Conectado: ${waStatus.name || waStatus.number}`
                    : 'Aguardando QR Code'}
                </p>
              </div>
            </div>
            {!waStatus.connected && waStatus.qr && (
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <QRCodeSVG value={waStatus.qr} size={72} />
              </div>
            )}
            {waStatus.connected && (
              <Button variant="danger" onClick={() => socket.emit('whatsapp-logout')}>
                Desconectar
              </Button>
            )}
          </Card>

          <Card glow>
            <CardTitle className="flex items-center gap-2 mb-4">
              <Users className="text-gold-500" size={20} />
              Contatos ({contacts.length})
            </CardTitle>
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Button variant="secondary" className="flex-1" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                <Upload size={18} />
                Importar CSV
              </Button>
              <Button variant="outline" className="flex-1" onClick={importFromMapsScrape} loading={loadingLeads}>
                {loadingLeads ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                Importar do Maps
              </Button>
              <Button variant="outline" onClick={() => setContacts([])}>
                Limpar
              </Button>
            </div>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80 p-2">
              {contacts.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6 font-medium">Nenhum contato</p>
              ) : (
                contacts.slice(0, 50).map((c, i) => (
                  <div key={i} className="flex justify-between p-2 text-sm rounded-lg hover:bg-white">
                    <span className="font-semibold text-navy-900">{c.name}</span>
                    <span className="text-slate-500">{c.number}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardTitle className="flex items-center gap-2 mb-4">
              <Send className="text-gold-500" size={20} />
              Mensagem
            </CardTitle>
            <Button variant="outline" className="mb-3 text-xs" onClick={() => setMessage((p) => p + '{nome}')}>
              + Nome
            </Button>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-32"
              placeholder="Digite sua mensagem…"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="dark" glow>
            <h3 className="font-black text-lg text-white mb-6">Controle</h3>
            {idle ? (
              <Button
                variant="gold"
                fullWidth
                className="py-4"
                onClick={startCampaign}
                disabled={!waStatus.connected || contacts.length === 0}
              >
                <Play size={18} />
                Iniciar campanha
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {campaign!.status === 'running' ? (
                  <Button variant="secondary" onClick={() => socket.emit('pause-campaign')}>
                    <Pause size={16} /> Pausar
                  </Button>
                ) : (
                  <Button variant="gold" onClick={() => socket.emit('resume-campaign')}>
                    <Play size={16} /> Retomar
                  </Button>
                )}
                <Button variant="danger" onClick={() => socket.emit('stop-campaign')}>
                  <Square size={16} /> Parar
                </Button>
              </div>
            )}

            {campaign && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                  <span>Progresso</span>
                  <span>
                    {campaign.stats.sent} / {campaign.stats.total}
                  </span>
                </div>
                <ProgressBar value={campaign.stats.sent} max={campaign.stats.total} className="mb-4 bg-white/10" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Sucesso</p>
                    <p className="text-xl font-black text-emerald-400">{campaign.stats.sent}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Erros</p>
                    <p className="text-xl font-black text-red-400">{campaign.stats.error}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <LogTerminal logs={logs} className="h-80" />
        </div>
      </div>
    </div>
  );
}
