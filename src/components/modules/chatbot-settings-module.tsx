// src/components/modules/chatbot-settings-module.tsx

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Save, 
  Settings2, 
  HelpCircle, 
  MessageSquare, 
  User, 
  Check, 
  AlertTriangle, 
  CornerDownRight, 
  Users, 
  Play, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { Card, CardTitle, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BotStep {
  id?: string;
  user_id: string;
  campaign_id: string | null;
  step_key: string;
  message_text: string;
  options: { trigger: string; next_step: string }[];
  is_initial: boolean;
}

interface ChatSession {
  id: string;
  customer_phone: string;
  campaign_id: string | null;
  campaigns?: { name: string } | null;
  current_step_key: string | null;
  status: 'CAMPANHA_PENDENTE' | 'GERAL' | 'HUMANO';
  last_interaction_at: string;
}

interface Campaign {
  id: string;
  name: string;
}

export function ChatbotSettingsModule() {
  const [subTab, setSubTab] = useState<'geral' | 'campanha' | 'sessoes'>('geral');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Dados do banco
  const [generalSteps, setGeneralSteps] = useState<BotStep[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [campaignSteps, setCampaignSteps] = useState<BotStep[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Estado do Editor
  const [activeStep, setActiveStep] = useState<BotStep | null>(null);
  const [stepKeyInput, setStepKeyInput] = useState('');
  const [messageTextInput, setMessageTextInput] = useState('');
  const [isInitialInput, setIsInitialInput] = useState(false);
  const [optionsInput, setOptionsInput] = useState<{ trigger: string; next_step: string }[]>([]);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    loadGeneralSteps();
    loadCampaigns();
    loadSessions();

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      const campaignIdParam = searchParams.get('campaignId');

      if (tabParam === 'chatbot' || campaignIdParam) {
        setSubTab('campanha');
        if (campaignIdParam) {
          setSelectedCampaignId(campaignIdParam);
        }
      }
    }
  }, []);

  // Recarregar passos quando mudar a campanha selecionada
  useEffect(() => {
    if (selectedCampaignId) {
      loadCampaignSteps(selectedCampaignId);
    } else {
      setCampaignSteps([]);
      setActiveStep(null);
    }
  }, [selectedCampaignId]);

  // Recarregar formulário ao selecionar outro passo
  useEffect(() => {
    if (activeStep) {
      setStepKeyInput(activeStep.step_key);
      setMessageTextInput(activeStep.message_text);
      setIsInitialInput(activeStep.is_initial);
      setOptionsInput(activeStep.options || []);
    } else {
      setStepKeyInput('');
      setMessageTextInput('');
      setIsInitialInput(false);
      setOptionsInput([]);
    }
  }, [activeStep]);

  // Helpers de Mensagem de Feedback
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- CARREGAMENTO DE DADOS ---

  const loadGeneralSteps = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bot_steps')
        .select('*')
        .is('campaign_id', null)
        .order('is_initial', { ascending: false })
        .order('step_key', { ascending: true });

      if (error) throw error;
      setGeneralSteps(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar passos gerais:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      if (data && data.length > 0) {
        setSelectedCampaignId(data[0].id);
      }
    } catch (err: any) {
      console.error('Erro ao buscar campanhas:', err.message);
    }
  };

  const loadCampaignSteps = async (campaignId: string) => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bot_steps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('is_initial', { ascending: false })
        .order('step_key', { ascending: true });

      if (error) throw error;
      setCampaignSteps(data || []);
      setActiveStep(null);
    } catch (err: any) {
      console.error('Erro ao buscar passos de campanha:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    if (!supabase) return;
    try {
      // Buscar sessões com nome da campanha se associada
      const { data, error } = await supabase
        .from('customer_chat_status')
        .select('id, customer_phone, campaign_id, current_step_key, status, last_interaction_at, campaigns(name)')
        .order('last_interaction_at', { ascending: false });

      if (error) throw error;
      // Tratar o retorno por conta da tipagem
      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        customer_phone: item.customer_phone,
        campaign_id: item.campaign_id,
        campaigns: item.campaigns,
        current_step_key: item.current_step_key,
        status: item.status,
        last_interaction_at: item.last_interaction_at
      }));
      setSessions(formatted);
    } catch (err: any) {
      console.error('Erro ao buscar sessões:', err.message);
    }
  };

  // --- INTERAÇÕES DE SESSÃO ---

  const handleUpdateSessionStatus = async (sessionId: string, newStatus: 'GERAL' | 'HUMANO' | 'CAMPANHA_PENDENTE') => {
    if (!supabase) return;
    try {
      setLoading(true);
      const updateData: any = { status: newStatus };
      if (newStatus === 'GERAL') {
        updateData.campaign_id = null;
        updateData.current_step_key = 'start';
      }
      const { error } = await supabase
        .from('customer_chat_status')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;
      triggerToast('Sessão atualizada com sucesso!');
      loadSessions();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!supabase) return;
    if (!confirm('Deseja realmente excluir esta sessão?')) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('customer_chat_status')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      triggerToast('Sessão excluída!');
      loadSessions();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- OPERAÇÕES DO EDITOR DE PASSOS ---

  const handleCreateNewStep = () => {
    setActiveStep({
      user_id: '', // será injetado
      campaign_id: subTab === 'geral' ? null : selectedCampaignId,
      step_key: `passo_${Date.now().toString().slice(-4)}`,
      message_text: '',
      options: [],
      is_initial: false
    });
  };

  const handleAddOption = () => {
    setOptionsInput([...optionsInput, { trigger: '', next_step: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptionsInput(optionsInput.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (index: number, field: 'trigger' | 'next_step', value: string) => {
    const updated = [...optionsInput];
    updated[index][field] = value;
    setOptionsInput(updated);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!supabase) return;
    if (!confirm('Deseja realmente excluir este passo do bot?')) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bot_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;
      triggerToast('Passo excluído com sucesso!');
      setActiveStep(null);
      
      if (subTab === 'geral') {
        loadGeneralSteps();
      } else {
        loadCampaignSteps(selectedCampaignId);
      }
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStep = async () => {
    if (!supabase) return;
    if (!stepKeyInput.trim()) return alert('A chave do passo é obrigatória.');
    if (!messageTextInput.trim()) return alert('O texto da mensagem é obrigatório.');

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // Validar chave única
      const isGeneral = subTab === 'geral';
      const campaignId = isGeneral ? null : selectedCampaignId;

      // Se for definido como inicial, limpar o is_initial dos outros passos deste mesmo contexto
      if (isInitialInput) {
        await supabase
          .from('bot_steps')
          .update({ is_initial: false })
          .eq('user_id', user.id)
          .eq(isGeneral ? 'campaign_id' : 'campaign_id', campaignId as any); // supabase filters handles null differently sometimes
          // wait, let's execute standard update filters
          if (isGeneral) {
            await supabase.from('bot_steps').update({ is_initial: false }).eq('user_id', user.id).is('campaign_id', null);
          } else {
            await supabase.from('bot_steps').update({ is_initial: false }).eq('user_id', user.id).eq('campaign_id', campaignId);
          }
      }

      // Filtrar opções vazias
      const cleanOptions = optionsInput.filter(opt => opt.trigger.trim() && opt.next_step.trim());

      const payload: BotStep = {
        id: activeStep?.id,
        user_id: user.id,
        campaign_id: campaignId,
        step_key: stepKeyInput.trim().toLowerCase(),
        message_text: messageTextInput.trim(),
        options: cleanOptions,
        is_initial: isInitialInput
      };

      const { error } = await supabase
        .from('bot_steps')
        .upsert(payload, { onConflict: 'user_id,campaign_id,step_key' });

      if (error) throw error;

      triggerToast('Configurações salvas!');
      
      if (isGeneral) {
        await loadGeneralSteps();
      } else {
        await loadCampaignSteps(selectedCampaignId);
      }
      setActiveStep(null);
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Obter todas as chaves disponíveis no contexto atual para o preenchimento de opções
  const getAvailableKeys = () => {
    const steps = subTab === 'geral' ? generalSteps : campaignSteps;
    const keys = steps.map(s => s.step_key).filter(k => k !== stepKeyInput);
    return ['start', 'humano', ...keys];
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 glass-panel-dark px-6 py-3 rounded-full flex items-center gap-2 text-gold-400 font-bold text-sm shadow-2xl animate-bounce">
          <Check size={18} />
          {toast}
        </div>
      )}

      {/* Tabs Internas */}
      <div className="flex border-b border-slate-100 pb-3 gap-2">
        <button
          onClick={() => { setSubTab('geral'); setActiveStep(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            subTab === 'geral' 
              ? 'bg-navy-900 text-gold-400' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Bot size={18} />
          Chatbot Geral (Receptivo)
        </button>
        <button
          onClick={() => { setSubTab('campanha'); setActiveStep(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            subTab === 'campanha' 
              ? 'bg-navy-900 text-gold-400' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Zap size={18} />
          Bot de Campanhas (Ativos)
        </button>
        <button
          onClick={() => { setSubTab('sessoes'); setActiveStep(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            subTab === 'sessoes' 
              ? 'bg-navy-900 text-gold-400' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users size={18} />
          Status das Conversas
        </button>
      </div>

      {/* =========================================
          ABA 1 E 2: EDITOR DE FLUXOS
          ========================================= */}
      {subTab !== 'sessoes' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Listagem de Passos */}
          <div className="lg:col-span-4 space-y-4">
            <Card glow>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-sm">Passos e Menus</CardTitle>
                <Button variant="outline" className="py-1 px-2.5 rounded-lg text-xs" onClick={handleCreateNewStep}>
                  <Plus size={14} /> Novo Passo
                </Button>
              </div>

              {subTab === 'campanha' && (
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Selecionar Campanha
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full text-sm font-bold text-navy-950 px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="">Selecione uma campanha...</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name || `Campanha #${c.id.substring(0,6)}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lista */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {subTab === 'campanha' && !selectedCampaignId ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Selecione uma campanha acima para configurar o bot.
                  </p>
                ) : (subTab === 'geral' ? generalSteps : campaignSteps).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Nenhum passo cadastrado. Clique em Novo Passo para começar.
                  </p>
                ) : (
                  (subTab === 'geral' ? generalSteps : campaignSteps).map((step) => {
                    const isActive = activeStep?.id === step.id || activeStep?.step_key === step.step_key;
                    return (
                      <div
                        key={step.id || step.step_key}
                        onClick={() => setActiveStep(step)}
                        className={`flex flex-col p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-navy-900 text-white border-navy-900 shadow-md shadow-navy-900/10' 
                            : 'bg-white/80 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold font-mono tracking-wide ${isActive ? 'text-gold-400' : 'text-navy-950'}`}>
                            {step.step_key}
                          </span>
                          <div className="flex items-center gap-1">
                            {step.is_initial && (
                              <Badge variant="gold" className="text-[9px] py-0.5 px-1.5 leading-none">
                                Inicial
                              </Badge>
                            )}
                            {step.options?.length > 0 ? (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                {step.options.length} opções
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                                Final
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs line-clamp-2 leading-relaxed ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          {step.message_text}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Coluna Direita: Editor do Passo Selecionado */}
          <div className="lg:col-span-8">
            {activeStep ? (
              <Card glow className="space-y-6">
                <CardHeader className="flex justify-between items-center pb-4 border-b border-slate-100 mb-0">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings2 size={18} className="text-gold-500" />
                      Editor de Passo do Chatbot
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure a chave, mensagem de resposta e opções de roteamento.
                    </CardDescription>
                  </div>
                  {activeStep.id && (
                    <Button variant="danger" onClick={() => handleDeleteStep(activeStep.id!)}>
                      <Trash2 size={15} /> Excluir
                    </Button>
                  )}
                </CardHeader>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Chave do Passo (ID)"
                    placeholder="ex: start, opcao_preco, suporte"
                    disabled={activeStep.step_key === 'start'}
                    value={stepKeyInput}
                    onChange={(e) => setStepKeyInput(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    hint="Identificador do passo no banco. Use letras, números e underline."
                  />
                  <div className="flex flex-col gap-2 justify-center pt-5">
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-navy-950">
                      <input
                        type="checkbox"
                        checked={isInitialInput}
                        onChange={(e) => setIsInitialInput(e.target.checked)}
                        className="rounded border-slate-300 text-navy-900 focus:ring-navy-900 h-4 w-4"
                      />
                      Passo Inicial de Entrada
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Primeira mensagem enviada quando o cliente entra no fluxo do bot.
                    </p>
                  </div>
                </div>

                <Textarea
                  label="Mensagem de Resposta"
                  placeholder="Olá! Seja bem-vindo. Escolha uma das opções abaixo:&#10;1. Saber preços&#10;2. Falar com atendente"
                  rows={6}
                  value={messageTextInput}
                  onChange={(e) => setMessageTextInput(e.target.value)}
                />

                {/* Opções de Decisão */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Opções e Roteamento (Menu de Opções)
                    </label>
                    <Button variant="outline" className="py-1 px-2.5 rounded-lg text-xs" onClick={handleAddOption}>
                      <Plus size={12} /> Adicionar Opção
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {optionsInput.length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-slate-100 rounded-xl">
                        <HelpCircle className="mx-auto text-slate-300 mb-1.5" size={24} />
                        <p className="text-xs text-slate-400 font-medium">
                          Nenhuma opção definida. O bot enviará essa mensagem e finalizará a automação (retornando ao Bot Geral no próximo disparo espontâneo).
                        </p>
                      </div>
                    ) : (
                      optionsInput.map((opt, index) => (
                        <div key={index} className="flex gap-3 items-center bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                          <CornerDownRight className="text-slate-400 shrink-0" size={16} />
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Gatilho (ex: 1, preço, sim, *)"
                              value={opt.trigger}
                              onChange={(e) => handleUpdateOption(index, 'trigger', e.target.value)}
                              className="w-full bg-white rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold focus:outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <select
                              value={opt.next_step}
                              onChange={(e) => handleUpdateOption(index, 'next_step', e.target.value)}
                              className="w-full bg-white rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold focus:outline-none"
                            >
                              <option value="">Selecione o próximo passo...</option>
                              {getAvailableKeys().map(key => (
                                <option key={key} value={key}>{key === 'humano' ? '🤝 Falar com Humano' : key}</option>
                              ))}
                            </select>
                          </div>
                          <Button variant="danger" className="p-2.5" onClick={() => handleRemoveOption(index)}>
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    * Use gatilho <b>*</b> ou <b>default</b> para capturar qualquer outra resposta do cliente como fallback.<br />
                    * Se o próximo passo for <b>humano</b>, o bot transitará a conversa para modo manual e silenciará.
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                  <Button variant="secondary" onClick={() => setActiveStep(null)}>
                    Cancelar
                  </Button>
                  <Button variant="gold" onClick={handleSaveStep}>
                    <Save size={16} /> Salvar Alterações
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center min-h-[300px]">
                <div className="max-w-sm space-y-2">
                  <Bot className="mx-auto text-slate-300" size={48} />
                  <h4 className="font-bold text-navy-950">Nenhum passo selecionado</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Selecione um passo do chatbot na lista à esquerda para editar, ou clique em &quot;Novo Passo&quot; para criar uma nova resposta automática.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          ABA 3: MONITOR DE CONVERSAS (SESSÕES)
          ========================================= */}
      {subTab === 'sessoes' && (
        <Card glow>
          <CardHeader className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={18} className="text-gold-500" />
                Live Monitoring (Status das Conversas)
              </CardTitle>
              <CardDescription className="text-xs">
                Acompanhe o estado de atendimento das conversas dos clientes em tempo real.
              </CardDescription>
            </div>
            <Button variant="secondary" onClick={loadSessions}>
              <RefreshCw size={14} className="mr-1" /> Atualizar
            </Button>
          </CardHeader>

          <div className="overflow-x-auto">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">
                Nenhuma conversa ativa no chatbot no momento.
              </p>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-4 px-4">Cliente</th>
                    <th className="py-4 px-4">Status Atual</th>
                    <th className="py-4 px-4">Origem / Campanha</th>
                    <th className="py-4 px-4">Passo Atual</th>
                    <th className="py-4 px-4">Última Interação</th>
                    <th className="py-4 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-bold text-navy-950 flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        {session.customer_phone}
                      </td>
                      <td className="py-4 px-4">
                        {session.status === 'HUMANO' && (
                          <Badge variant="error">
                            🤝 Atend. Humano
                          </Badge>
                        )}
                        {session.status === 'GERAL' && (
                          <Badge variant="live">
                            🤖 Bot Geral (FAQ)
                          </Badge>
                        )}
                        {session.status === 'CAMPANHA_PENDENTE' && (
                          <Badge variant="gold">
                            🚀 Campanha Ativa
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 max-w-[180px] truncate">
                        {session.campaigns?.name || <span className="text-slate-400">Mensagem Espontânea</span>}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs">
                        {session.current_step_key || '-'}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {new Date(session.last_interaction_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-4 px-4 text-right space-x-1">
                        {session.status !== 'HUMANO' && (
                          <Button 
                            variant="outline" 
                            className="py-1 px-2 text-xs" 
                            onClick={() => handleUpdateSessionStatus(session.id, 'HUMANO')}
                          >
                            Chamar Humano
                          </Button>
                        )}
                        {session.status !== 'GERAL' && (
                          <Button 
                            variant="secondary" 
                            className="py-1 px-2 text-xs" 
                            onClick={() => handleUpdateSessionStatus(session.id, 'GERAL')}
                          >
                            Mandar p/ Bot
                          </Button>
                        )}
                        <Button 
                          variant="danger" 
                          className="py-1 px-2 text-xs p-1"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
