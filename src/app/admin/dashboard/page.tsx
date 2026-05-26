'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Users, MessageSquare, TrendingUp, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { AdminStats, PendingApproval } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'users'>('overview');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUserId = localStorage.getItem('user_id');
    
    if (!storedToken || !storedUserId) {
      window.location.href = '/admin/login';
      return;
    }

    setToken(storedToken);
    setUserId(storedUserId);
    fetchStats(storedToken, storedUserId);
  }, []);

  const fetchStats = async (token: string, userId: string) => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('user_id');
          window.location.href = '/admin/login';
          return;
        }
      }

      const data = await response.json();
      setStats(data);

      if (activeTab === 'users') {
        fetchUsers(token, userId);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (token: string, userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });

      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!token) return;
    
    setProcessingId(userId);
    try {
      const response = await fetch(`/api/admin/approve-user/${userId}`, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${token}`,
          'x-user-id': userId || ''
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Usuário aprovado!' });
        setTimeout(() => {
          if (token && userId) fetchStats(token, userId);
        }, 1000);
      } else {
        setMessage({ type: 'error', text: 'Erro ao aprovar usuário' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao conectar' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!token) return;

    const reason = prompt('Motivo da rejeição (opcional):');
    if (reason === null) return;

    setProcessingId(userId);
    try {
      const response = await fetch(`/api/admin/reject-user/${userId}`, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${token}`,
          'x-user-id': userId || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Usuário rejeitado' });
        setTimeout(() => {
          if (token && userId) fetchStats(token, userId);
        }, 1000);
      } else {
        setMessage({ type: 'error', text: 'Erro ao rejeitar usuário' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao conectar' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_id');
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white font-bold">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 text-white">
      {/* Header */}
      <nav className="bg-blue-900/20 backdrop-blur-md border-b border-blue-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg p-1.5 flex items-center justify-center font-black">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">LeadScrap</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg transition-all"
          >
            <LogOut size={16} />
            <span className="text-sm font-bold">Sair</span>
          </button>
        </div>
      </nav>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-40 px-6 py-3 rounded-lg font-bold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-200 border border-green-500/30'
                : 'bg-red-500/10 text-red-200 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-blue-500/20 pb-4">
          {(['overview', 'approvals', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'users' && token && userId) {
                  fetchUsers(token, userId);
                }
              }}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {tab === 'overview' && '📊 Visão Geral'}
              {tab === 'approvals' && '⏳ Aprovações'}
              {tab === 'users' && '👥 Usuários'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  icon: Users,
                  label: 'Total de Usuários',
                  value: stats.total_users,
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  icon: Clock,
                  label: 'Pendentes',
                  value: stats.pending_approvals,
                  color: 'from-yellow-500 to-yellow-600'
                },
                {
                  icon: TrendingUp,
                  label: 'Disparos Hoje',
                  value: stats.total_sent_today,
                  color: 'from-green-500 to-green-600'
                },
                {
                  icon: MessageSquare,
                  label: 'Contatos Hoje',
                  value: stats.total_contacts_today,
                  color: 'from-purple-500 to-purple-600'
                }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 border border-white/10`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm font-bold">{stat.label}</p>
                        <p className="text-4xl font-black mt-2">{stat.value}</p>
                      </div>
                      <Icon className="w-12 h-12 text-white/30" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Activity */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-black mb-4">📈 Atividade</h2>
              <div className="space-y-2 text-slate-300">
                <p>✓ <strong>{stats.total_campaigns_today}</strong> campanhas criadas hoje</p>
                <p>✓ <strong>{stats.total_sent_today}</strong> mensagens disparadas</p>
                <p>✓ <strong>{stats.total_contacts_today}</strong> contatos processados</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {stats.pending_approvals_list.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-slate-300 font-bold">Nenhuma aprovação pendente!</p>
              </div>
            ) : (
              stats.pending_approvals_list.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-black text-lg">{user.name}</h3>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                    <p className="text-slate-500 text-xs mt-2">
                      {user.company && `🏢 ${user.company}`}
                      {user.phone && ` • 📱 ${user.phone}`}
                    </p>
                    <p className="text-yellow-400 text-xs font-bold mt-2">
                      ⏱️ {user.hours_pending}h pendente
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={processingId === user.id}
                      className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                    >
                      {processingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      disabled={processingId === user.id}
                      className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                    >
                      {processingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle size={18} />
                      )}
                      Rejeitar
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 overflow-x-auto"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-black">Email</th>
                  <th className="text-left py-3 px-4 font-black">Nome</th>
                  <th className="text-left py-3 px-4 font-black">Status</th>
                  <th className="text-left py-3 px-4 font-black">Último Acesso</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4 font-bold">{user.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        user.status === 'approved'
                          ? 'bg-green-500/20 text-green-300'
                          : user.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {user.status === 'approved' && '✓ Aprovado'}
                        {user.status === 'pending' && '⏳ Pendente'}
                        {user.status === 'rejected' && '✗ Rejeitado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {user.last_access
                        ? new Date(user.last_access).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </div>
  );
}
