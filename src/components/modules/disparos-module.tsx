'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Users, Phone, Upload, Play, Pause, Square, MapPin, Loader2, Plus, Trash2, Save, Download, MessageSquare } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from '@/services/socket';
import { supabase } from '@/lib/supabase';
import { Contact, Campaign, WhatsAppStatus, MessageTemplate } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea, Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { LogTerminal, LogEntry } from '@/components/ui/log-terminal';
import { loadAutomationFromStorage } from '@/lib/automation-storage';
import { toast } from 'sonner';

export function DisparosModule() {
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({ connected: false, state: 'disconnected' });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [message, setMessage] = useState('Olá {nome}, tudo bem?');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced features states
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);
  
  const [searches, setSearches] = useState<any[]>([]);
  const [selectedSearchIds, setSelectedSearchIds] = useState<string[]>([]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [newCampaignName, setNewCampaignName] = useState<string>('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState<boolean>(false);

  // Fetch initial data from Supabase
  const fetchData = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Message templates
      const { data: tmpls, error: tmplError } = await supabase
        .from('message_templates')
        .select('*')
        .order('name');
      if (!tmplError) setTemplates(tmpls || []);

      // 2. Google Maps searches history
      const { data: srchs, error: srchsError } = await supabase
        .from('scraped_searches')
        .select('*')
        .order('created_at', { ascending: false });
      if (!srchsError) setSearches(srchs || []);

      // 3. Saved campaigns
      const { data: camps, error: campsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!campsError && camps) {
        const mappedCamps: Campaign[] = camps.map((c) => ({
          id: c.id,
          name: c.name,
          message: c.message,
          contacts: c.contacts,
          delayMin: c.delay_min,
          delayMax: c.delay_max,
          status: c.status,
          stats: c.stats,
          automation: c.automation,
          scheduledAt: c.scheduled_at
        }));
        setCampaigns(mappedCamps);
      }
    } catch (err) {
      console.error('Erro ao buscar dados iniciais:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load from localStorage on mount (supporting legacy keys)
  useEffect(() => {
    const keys = ['pending_disparos_contacts', 'ls_pending_imported_contacts'];
    for (const key of keys) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setContacts(parsed);
            localStorage.removeItem(key);
            break;
          }
        }
      } catch (err) {
        console.error(`Error loading pending contacts from ${key}:`, err);
      }
    }
  }, []);

  useEffect(() => {
    const onStatus = (s: WhatsAppStatus) => setWaStatus(s);
    const onCamp = (c: Campaign) => setCampaign(c);
    const onLog = (log: { message: string; timestamp: Date }) =>
      setLogs((prev) => [...prev, { msg: log.message, time: new Date(log.timestamp) }].slice(-50));

    socket.on('whatsapp-status', onStatus);
    socket.on('campaign-update', onCamp);
    socket.on('log', onLog);
    socket.emit('get-whatsapp-status');
    socket.emit('get-campaign-status');

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
      if (data.success) {
        setContacts(data.contacts);
        toast.success(`${data.contacts.length} contatos carregados via CSV!`);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao enviar CSV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Google Maps searches merging logic
  const mergeSelectedSearches = async () => {
    if (!supabase) return;
    if (selectedSearchIds.length === 0) return toast.error('Selecione pelo menos uma pesquisa');

    setLoadingLeads(true);
    try {
      const { data, error } = await supabase
        .from('scraped_leads')
        .select('title, phone')
        .in('search_id', selectedSearchIds);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('Nenhum lead encontrado nas pesquisas selecionadas.');
        return;
      }

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

      // Deduplicate by number
      const uniqueContacts: Contact[] = [];
      const numbersSeen = new Set<string>();
      for (const c of mappedContacts) {
        if (!numbersSeen.has(c.number)) {
          numbersSeen.add(c.number);
          uniqueContacts.push(c);
        }
      }

      if (uniqueContacts.length === 0) {
        toast.error('Nenhum contato com número de WhatsApp válido encontrado.');
        return;
      }

      setContacts(uniqueContacts);
      toast.success(`${uniqueContacts.length} contatos únicos carregados e mesclados!`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao carregar leads: ${err.message}`);
    } finally {
      setLoadingLeads(false);
    }
  };

  const removeContact = (number: string) => {
    setContacts(prev => prev.filter(c => c.number !== number));
    toast.success('Contato removido');
  };

  const exportContactsToCSV = () => {
    if (contacts.length === 0) return toast.error('Nenhum contato para exportar');

    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Nome,Numero"].concat(contacts.map(c => `"${c.name.replace(/"/g, '""')}",${c.number}`)).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contatos_mesclados_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exportado com sucesso!');
  };

  // Message template logic
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const tmpl = templates.find(t => t.id === id);
    if (tmpl) setMessage(tmpl.content);
  };

  const saveTemplate = async () => {
    if (!supabase) return;
    if (!newTemplateName.trim()) return toast.error('Digite o nome do template');
    if (!message.trim()) return toast.error('A mensagem não pode estar vazia');

    setIsSavingTemplate(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          user_id: user.id,
          name: newTemplateName,
          content: message
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Template salvo com sucesso!');
      setTemplates(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedTemplateId(data.id);
      setNewTemplateName('');
    } catch (err: any) {
      toast.error('Erro ao salvar template: ' + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const deleteTemplate = async () => {
    if (!supabase || !selectedTemplateId) return;
    if (!confirm('Deseja realmente excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', selectedTemplateId);

      if (error) throw error;

      toast.success('Template excluído!');
      setTemplates(prev => prev.filter(t => t.id !== selectedTemplateId));
      setSelectedTemplateId('');
    } catch (err: any) {
      toast.error('Erro ao excluir template: ' + err.message);
    }
  };

  // Campaign management logic
  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignId(id);
    if (!id) return;
    const camp = campaigns.find(c => c.id === id);
    if (camp) {
      setMessage(camp.message);
      setContacts(camp.contacts);
    }
  };

  const createCampaign = async () => {
    if (!supabase) return;
    if (!newCampaignName.trim()) return toast.error('Digite o nome da campanha');

    setIsCreatingCampaign(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const automation = loadAutomationFromStorage();
      const newCampData = {
        user_id: user.id,
        name: newCampaignName,
        title: newCampaignName, // ponytail: backward compatibility for schemas where 'title' is NOT NULL
        message: message,
        contacts: contacts.map(c => ({ ...c, status: c.status || 'pending' })),
        delay_min: automation.delayMin,
        delay_max: automation.delayMax,
        status: 'draft',
        stats: { sent: 0, error: 0, total: contacts.length, pending: contacts.length },
        automation
      };

      const { data, error } = await supabase
        .from('campaigns')
        .insert(newCampData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Campanha criada com sucesso!');
      const newCamp: Campaign = {
        id: data.id,
        name: data.name,
        message: data.message,
        contacts: data.contacts,
        delayMin: data.delay_min,
        delayMax: data.delay_max,
        status: data.status,
        stats: data.stats,
        automation: data.automation,
        scheduledAt: data.scheduled_at
      };

      setCampaigns(prev => [newCamp, ...prev]);
      setSelectedCampaignId(data.id);
      setNewCampaignName('');
    } catch (err: any) {
      toast.error('Erro ao criar campanha: ' + err.message);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const saveCampaignAsDraft = async () => {
    if (!supabase || !selectedCampaignId) return toast.error('Selecione uma campanha primeiro');

    try {
      const camp = campaigns.find(c => c.id === selectedCampaignId);
      if (!camp) return;

      const updated = {
        message,
        contacts: contacts.map(c => ({ ...c, status: c.status || 'pending' })),
        stats: {
          sent: contacts.filter(c => c.status === 'sent').length,
          error: contacts.filter(c => c.status === 'error').length,
          total: contacts.length,
          pending: contacts.filter(c => !c.status || c.status === 'pending').length
        }
      };

      const { error } = await supabase
        .from('campaigns')
        .update(updated)
        .eq('id', selectedCampaignId);

      if (error) throw error;

      toast.success('Campanha salva como rascunho!');
      setCampaigns(prev => prev.map(c => c.id === selectedCampaignId ? { ...c, ...updated } : c));
    } catch (err: any) {
      toast.error('Erro ao salvar rascunho: ' + err.message);
    }
  };

  const deleteCampaign = async () => {
    if (!supabase || !selectedCampaignId) return;
    if (!confirm('Deseja realmente excluir esta campanha?')) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', selectedCampaignId);

      if (error) throw error;

      toast.success('Campanha excluída!');
      if (selectedCampaignId === campaign?.id) {
        socket.emit('clear-campaign');
        setCampaign(null);
      }
      setCampaigns(prev => prev.filter(c => c.id !== selectedCampaignId));
      setSelectedCampaignId('');
    } catch (err: any) {
      toast.error('Erro ao excluir campanha: ' + err.message);
    }
  };

  const startCampaign = () => {
    if (contacts.length === 0) return toast.error('Importe ou selecione contatos primeiro');
    if (!message.trim()) return toast.error('Digite uma mensagem');
    if (!waStatus.connected) return toast.error('Conecte o WhatsApp primeiro');

    const automation = loadAutomationFromStorage();
    const campaignId = selectedCampaignId || crypto.randomUUID();
    const campaignName = campaigns.find(c => c.id === selectedCampaignId)?.name || 'Campanha Direta';

    const newCampaign: Campaign = {
      id: campaignId,
      name: campaignName,
      message,
      contacts: contacts.map((c) => ({ ...c, status: c.status || 'pending' })),
      delayMin: automation.delayMin,
      delayMax: automation.delayMax,
      status: 'idle',
      stats: {
        sent: contacts.filter(c => c.status === 'sent').length,
        error: contacts.filter(c => c.status === 'error').length,
        total: contacts.length,
        pending: contacts.filter(c => !c.status || c.status === 'pending').length
      },
      automation,
    };

    socket.emit('start-campaign', newCampaign);
  };

  const toggleSearchSelection = (id: string) => {
    setSelectedSearchIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const idle = !campaign || ['idle', 'completed', 'stopped'].includes(campaign.status);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Gerenciador de Disparos"
        description="Crie campanhas dinâmicas, mescle leads do Maps, gerencie templates e envie mensagens automatizadas."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* CAMPAIGN CRUD CARD */}
          <Card glow>
            <CardTitle className="flex items-center gap-2 mb-4 text-navy-950">
              <Send className="text-v-blue-500" size={20} />
              Campanhas de Disparo
            </CardTitle>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Selecionar Campanha Salva
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => handleSelectCampaign(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-v-blue-500/25"
                  >
                    <option value="">Selecione uma campanha...</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                  {selectedCampaignId && (
                    <Button variant="danger" onClick={deleteCampaign} title="Excluir Campanha">
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Nova Campanha
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da campanha..."
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                  />
                  <Button variant="secondary" onClick={createCampaign} loading={isCreatingCampaign}>
                    <Plus size={16} /> Criar
                  </Button>
                </div>
              </div>
            </div>

            {selectedCampaignId && (
              <div className="mt-4 flex flex-wrap gap-2 justify-between items-center border-t border-slate-100 pt-3">
                <a
                  href={`/automacao?tab=chatbot&campaignId=${selectedCampaignId}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold bg-navy-900 text-gold-400 border border-navy-800 hover:bg-navy-800 transition-all shadow-sm"
                >
                  <MessageSquare size={13} className="text-gold-500" /> Configurar Roteiro do Bot
                </a>
                <Button variant="outline" className="py-1.5 px-3.5 text-xs rounded-xl" onClick={saveCampaignAsDraft}>
                  <Save size={14} className="mr-1.5" /> Salvar Rascunho
                </Button>
              </div>
            )}
          </Card>

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

          {/* CONTACTS INTEGRATION & MERGING */}
          <Card glow>
            <CardTitle className="flex items-center gap-2 mb-4">
              <Users className="text-gold-500" size={20} />
              Contatos ({contacts.length})
            </CardTitle>

            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            
            <div className="grid md:grid-cols-3 gap-3 mb-5">
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                <Upload size={16} className="mr-1.5" /> Importar CSV
              </Button>
              <Button variant="outline" onClick={exportContactsToCSV} disabled={contacts.length === 0}>
                <Download size={16} className="mr-1.5" /> Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => setContacts([])} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                Limpar Lista
              </Button>
            </div>

            {/* Google Maps History Merging */}
            {searches.length > 0 && (
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 mb-5 space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Mesclar Histórico do Google Maps
                </label>
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                  {searches.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-xs font-semibold text-navy-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedSearchIds.includes(s.id)}
                        onChange={() => toggleSearchSelection(s.id)}
                        className="rounded border-slate-300 text-v-blue-600 focus:ring-v-blue-500"
                      />
                      <span>{s.query} <span className="text-slate-400">({s.found_count} leads)</span></span>
                    </label>
                  ))}
                </div>
                <Button variant="outline" fullWidth onClick={mergeSelectedSearches} loading={loadingLeads}>
                  <MapPin size={14} className="mr-1.5" /> Mesclar Pesquisas Selecionadas
                </Button>
              </div>
            )}

            {/* Contacts Table with Delete option */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80">
              {contacts.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10 font-medium">Nenhum contato importado.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-3">Nome</th>
                      <th className="p-3">Número</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.slice(0, 100).map((c, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-white transition-colors">
                        <td className="p-3 font-semibold text-navy-900">{c.name}</td>
                        <td className="p-3 text-slate-500">{c.number}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => removeContact(c.number)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                            title="Remover Contato"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {contacts.length > 100 && (
              <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                Exibindo primeiros 100 de {contacts.length} contatos. Todos serão processados na campanha.
              </p>
            )}
          </Card>

          {/* MESSAGES & TEMPLATES CARD */}
          <Card>
            <CardTitle className="flex items-center gap-2 mb-4">
              <Send className="text-gold-500" size={20} />
              Templates de Mensagem
            </CardTitle>

            <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Carregar Template
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-v-blue-500/25"
                  >
                    <option value="">Selecione um template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {selectedTemplateId && (
                    <Button variant="danger" onClick={deleteTemplate} title="Excluir Template">
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Salvar Mensagem Atual como Template
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do template..."
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                  />
                  <Button variant="secondary" onClick={saveTemplate} loading={isSavingTemplate}>
                    <Save size={16} /> Salvar
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Editor de Mensagem</span>
              <Button variant="outline" className="py-1.5 px-3.5 text-xs rounded-xl" onClick={() => setMessage((p) => p + '{nome}')}>
                + Inserir Nome
              </Button>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-32"
              placeholder="Escreva sua mensagem aqui… Use {nome} para personalizar."
            />
          </Card>
        </div>

        {/* RIGHT COLUMN (CONTROLS & LOGS) */}
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
                  <span>Progresso ({campaign.name || 'Disparo'})</span>
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
                {['completed', 'stopped'].includes(campaign.status) && (
                  <Button
                    variant="outline"
                    fullWidth
                    className="mt-4 border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      socket.emit('clear-campaign');
                      setCampaign(null);
                    }}
                  >
                    Concluir e Limpar Painel
                  </Button>
                )}
              </div>
            )}
          </Card>

          <LogTerminal logs={logs} className="h-80" />
        </div>
      </div>
    </div>
  );
}
