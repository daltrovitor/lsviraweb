'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Users, MessageSquare, TrendingUp, LogOut, Loader2, AlertCircle, Phone, Mail, Calendar, Clock, MessageCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type Lead = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  status: 'pending' | 'contacted' | 'converted' | 'lost';
  notes: string;
  created_at: string;
  updated_at: string;
};

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads'>('overview');
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      console.error('Erro ao buscar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    if (!supabase) return;
    
    setProcessingId(leadId);
    try {
      const { error } = await supabase
        .from('landing_leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
      
      toast.success('Status atualizado com sucesso');
      fetchLeads();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const stats = {
    total: leads.length,
    pending: leads.filter(l => l.status === 'pending').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  if (loading) {
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
    <div className="min-h-screen bg-white text-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Admin Dashboard</h1>
              <p className="text-xs text-slate-500 font-medium">LeadScrap</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl transition-all font-semibold"
          >
            <LogOut size={16} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
          {(['overview', 'leads'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${
                activeTab === tab
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'overview' && '📊 Visão Geral'}
              {tab === 'leads' && '👥 Leads'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid md:grid-cols-5 gap-6">
              {[
                {
                  icon: Users,
                  label: 'Total de Leads',
                  value: stats.total,
                  color: 'from-blue-500 to-blue-600',
                  bg: 'bg-blue-50'
                },
                {
                  icon: Clock,
                  label: 'Pendentes',
                  value: stats.pending,
                  color: 'from-amber-500 to-amber-600',
                  bg: 'bg-amber-50'
                },
                {
                  icon: MessageCircle,
                  label: 'Contactados',
                  value: stats.contacted,
                  color: 'from-purple-500 to-purple-600',
                  bg: 'bg-purple-50'
                },
                {
                  icon: CheckCircle2,
                  label: 'Convertidos',
                  value: stats.converted,
                  color: 'from-emerald-500 to-emerald-600',
                  bg: 'bg-emerald-50'
                },
                {
                  icon: XCircle,
                  label: 'Perdidos',
                  value: stats.lost,
                  color: 'from-red-500 to-red-600',
                  bg: 'bg-red-50'
                }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon size={20} />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                <TrendingUp className="text-blue-500" size={24} />
                Leads Recentes
              </h2>
              <div className="space-y-3">
                {leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {lead.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{lead.full_name}</p>
                        <p className="text-xs text-slate-500">{lead.email}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      lead.status === 'pending' && 'bg-amber-100 text-amber-700'
                    } || (lead.status === 'contacted' && 'bg-purple-100 text-purple-700')
                    } || (lead.status === 'converted' && 'bg-emerald-100 text-emerald-700')
                    } || (lead.status === 'lost' && 'bg-red-100 text-red-700')
                    }`}>
                      {lead.status === 'pending' && '⏳ Pendente'}
                      {lead.status === 'contacted' && '📞 Contactado'}
                      {lead.status === 'converted' && '✓ Convertido'}
                      {lead.status === 'lost' && '✗ Perdido'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <Users className="text-blue-500" size={24} />
                Gerenciar Leads
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-4 px-6 font-bold text-slate-700">Nome</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700">Email</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700">WhatsApp</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700">Data</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">{lead.full_name}</td>
                      <td className="py-4 px-6 text-slate-600">{lead.email}</td>
                      <td className="py-4 px-6 text-slate-600 flex items-center gap-2">
                        <MessageCircle size={16} className="text-emerald-500" />
                        {lead.whatsapp}
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead['status'])}
                          disabled={processingId === lead.id}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        >
                          <option value="pending">⏳ Pendente</option>
                          <option value="contacted">📞 Contactado</option>
                          <option value="converted">✓ Convertido</option>
                          <option value="lost">✗ Perdido</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-6">
                        <a
                          href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <MessageCircle size={14} />
                          WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
