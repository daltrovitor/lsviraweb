'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Users, LogOut, Loader2, AlertCircle, Phone, Mail, Calendar, Clock, MessageCircle, Shield, UserPlus, Ban, Key } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type Lead = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  password?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
  updated_at: string;
};

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  status: string;
  last_access: string;
  created_at: string;
  campaigns_sent: number;
  leads_extracted: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'pending'>('members');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState<{ [key: string]: string }>({});

  // Check authentication and admin role on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        router.replace('/admin/login');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('[AdminDashboard] No session found');
        router.replace('/admin/login');
        return;
      }

      console.log('[AdminDashboard] Session found for user:', session.user.id);

      // Check user role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      console.log('[AdminDashboard] Profile check - Profile:', profile, 'Error:', error);

      if (error || !profile || profile.role !== 'admin') {
        console.error('[AdminDashboard] User is not admin or profile not found');
        router.replace('/admin/login');
        return;
      }

      console.log('[AdminDashboard] User is admin, allowing access');
      setAuthChecking(false);
    };

    checkAuth();
  }, [router]);

  const fetchLeads = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('landing_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.warn('Landing leads table not accessible or empty:', error);
      setLeads([]); // Set empty array if table doesn't exist
    }
  };

  const fetchMembers = async () => {
    if (!supabase) return;
    
    try {
      // Fetch profiles with their stats
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // For each profile, fetch their stats
      const membersWithStats = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          if (!supabase) return null;

          let totalSent = 0;
          let totalLeads = 0;

          // Count campaigns sent (handle if table doesn't exist)
          try {
            const { data: campaigns } = await supabase
              .from('campaigns')
              .select('sent_count')
              .eq('user_id', profile.id);

            totalSent = campaigns?.reduce((sum: number, c: any) => sum + (c.sent_count || 0), 0) || 0;
          } catch (e) {
            console.warn('Campaigns table not accessible:', e);
          }

          // Count leads extracted from map_searches (handle if table doesn't exist)
          try {
            const { data: searches } = await supabase
              .from('map_searches')
              .select('total_results')
              .eq('user_id', profile.id);

            totalLeads = searches?.reduce((sum: number, s: any) => sum + (s.total_results || 0), 0) || 0;
          } catch (e) {
            console.warn('Map searches table not accessible:', e);
          }

          return {
            id: profile.id,
            full_name: profile.full_name || profile.email || 'Sem nome',
            email: profile.email || '',
            role: profile.role,
            status: profile.status,
            last_access: profile.last_access,
            created_at: profile.created_at,
            campaigns_sent: totalSent,
            leads_extracted: totalLeads
          };
        })
      );

      setMembers(membersWithStats.filter((m): m is UserProfile => m !== null));
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      toast.error('Erro ao carregar membros');
    }
  };

  useEffect(() => {
    if (!authChecking) {
      const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchLeads(), fetchMembers()]);
        setLoading(false);
      };
      fetchData();
    }
  }, [authChecking]);

  const handleApproveLead = async (leadId: string) => {
    if (!supabase) return;
    
    const password = passwordInput[leadId];
    if (!password) {
      toast.error('Por favor, defina uma senha para o novo membro');
      return;
    }

    setProcessingId(leadId);
    try {
      // Get the lead data
      const { data: lead, error: leadError } = await supabase
        .from('landing_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: lead.email,
        password: password,
        options: {
          data: {
            full_name: lead.full_name
          }
        }
      });

      if (authError) throw authError;

      // Update lead status to approved
      const { error: updateError } = await supabase
        .from('landing_leads')
        .update({ 
          status: 'approved',
          password: password,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;
      
      toast.success('Membro aprovado com sucesso! Usuário criado.');
      setPasswordInput({ ...passwordInput, [leadId]: '' });
      fetchLeads();
      fetchMembers();
    } catch (error) {
      console.error('Erro ao aprovar membro:', error);
      toast.error('Erro ao aprovar membro');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectLead = async (leadId: string) => {
    if (!supabase) return;
    
    setProcessingId(leadId);
    try {
      const { error } = await supabase
        .from('landing_leads')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
      
      toast.success('Lead rejeitado com sucesso');
      fetchLeads();
    } catch (error) {
      console.error('Erro ao rejeitar lead:', error);
      toast.error('Erro ao rejeitar lead');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateMemberStatus = async (profileId: string, newStatus: string) => {
    if (!supabase) return;
    
    setProcessingId(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', profileId);

      if (error) throw error;
      
      toast.success('Status do membro atualizado com sucesso');
      fetchMembers();
    } catch (error) {
      console.error('Erro ao atualizar status do membro:', error);
      toast.error('Erro ao atualizar status do membro');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    window.location.href = '/';
  };

  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.status === 'active').length,
    pendingMembers: members.filter(m => m.status === 'pending').length,
    pendingLeads: leads.filter(l => l.status === 'pending').length,
    totalCampaigns: members.reduce((sum, m) => sum + m.campaigns_sent, 0),
    totalLeads: members.reduce((sum, m) => sum + m.leads_extracted, 0),
  };

  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-900 font-bold">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Generative Vector Noise Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-xl border-b-2 border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-10 h-10" />
            <div className="border-l-2 border-slate-200 pl-4">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">ADMIN DASHBOARD</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">LeadScrap Control Panel</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-300 px-4 py-2 transition-all font-bold uppercase text-xs tracking-wider"
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          {[
            {
              icon: Users,
              label: 'Total Membros',
              value: stats.totalMembers,
              color: 'border-blue-500',
              bg: 'bg-blue-50',
              text: 'text-blue-600'
            },
            {
              icon: CheckCircle2,
              label: 'Membros Ativos',
              value: stats.activeMembers,
              color: 'border-emerald-500',
              bg: 'bg-emerald-50',
              text: 'text-emerald-600'
            },
            {
              icon: Clock,
              label: 'Pendentes',
              value: stats.pendingMembers + stats.pendingLeads,
              color: 'border-amber-500',
              bg: 'bg-amber-50',
              text: 'text-amber-600'
            },
            {
              icon: MessageCircle,
              label: 'Total Disparos',
              value: stats.totalCampaigns,
              color: 'border-purple-500',
              bg: 'bg-purple-50',
              text: 'text-purple-600'
            },
            {
              icon: Shield,
              label: 'Total Leads',
              value: stats.totalLeads,
              color: 'border-cyan-500',
              bg: 'bg-cyan-50',
              text: 'text-cyan-600'
            }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-white border-2 ${stat.color} p-4 shadow-sm hover:shadow-md transition-all`}
              >
                <div className={`w-10 h-10 ${stat.bg} ${stat.text} flex items-center justify-center mb-3`}>
                  <Icon size={18} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b-2 border-slate-200 pb-4">
          {(['members', 'pending'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 font-bold uppercase text-xs tracking-wider transition-all border-2 ${
                activeTab === tab
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
              }`}
            >
              {tab === 'members' && '� Membros Aprovados'}
              {tab === 'pending' && '📋 Solicitações Pendentes'}
            </button>
          ))}
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border-2 border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b-2 border-slate-200 bg-slate-50">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Membros Cadastrados
              </h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Usuários cadastrados diretamente</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900 border-b-2 border-slate-800">
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Nome</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Role</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Status</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Último Acesso</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Disparos</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Leads</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs">{member.full_name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                          member.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {member.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={member.status}
                          onChange={(e) => handleUpdateMemberStatus(member.id, e.target.value)}
                          disabled={processingId === member.id}
                          className="px-2 py-1 border-2 border-slate-300 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-slate-500 disabled:opacity-50 bg-white"
                        >
                          <option value="active">Ativo</option>
                          <option value="suspended">Suspenso</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {member.last_access ? new Date(member.last_access).toLocaleDateString('pt-BR') : 'Nunca'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs">{member.campaigns_sent}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs">{member.leads_extracted}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {member.status === 'active' && (
                            <button
                              onClick={() => handleUpdateMemberStatus(member.id, 'suspended')}
                              disabled={processingId === member.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                              <Ban size={12} />
                              Suspender
                            </button>
                          )}
                          {member.status === 'suspended' && (
                            <button
                              onClick={() => handleUpdateMemberStatus(member.id, 'active')}
                              disabled={processingId === member.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 size={12} />
                              Reativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border-2 border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b-2 border-slate-200 bg-slate-50">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Solicitações de Membro
              </h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Aprovações pendentes</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900 border-b-2 border-slate-800">
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Nome</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Email</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">WhatsApp</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Senha</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Data</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-xs tracking-wider text-white">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.filter(l => l.status === 'pending').map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs">{lead.full_name}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{lead.email}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs flex items-center gap-2">
                        <MessageCircle size={14} className="text-emerald-500" />
                        {lead.whatsapp}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="password"
                          placeholder="Senha"
                          value={passwordInput[lead.id] || ''}
                          onChange={(e) => setPasswordInput({ ...passwordInput, [lead.id]: e.target.value })}
                          className="px-2 py-1 border-2 border-slate-300 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-slate-500 w-32"
                        />
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApproveLead(lead.id)}
                            disabled={processingId === lead.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 size={12} />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleRejectLead(lead.id)}
                            disabled={processingId === lead.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            Rejeitar
                          </button>
                          <a
                            href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wider transition-colors"
                          >
                            <MessageCircle size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {members.filter(m => m.status === 'pending').map((member) => (
                    <tr key={member.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-amber-50">
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs">{member.full_name}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{member.email}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">-</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">Já cadastrado</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUpdateMemberStatus(member.id, 'active')}
                            disabled={processingId === member.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 size={12} />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleUpdateMemberStatus(member.id, 'suspended')}
                            disabled={processingId === member.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {leads.filter(l => l.status === 'pending').length === 0 && members.filter(m => m.status === 'pending').length === 0 && (
                <div className="p-12 text-center">
                  <UserPlus size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Nenhuma solicitação pendente</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
