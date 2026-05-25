'use client';

import { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      if (data.user.role !== 'admin') {
        setError('Acesso negado. Este painel é apenas para administradores.');
        return;
      }

      // Salvar token e info do usuário
      localStorage.setItem('admin_token', 'mock-token');
      localStorage.setItem('user_id', data.user.id);
      
      // Redirecionar para dashboard
      window.location.href = '/admin/dashboard';
    } catch (error) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800 text-white flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-black text-lg">
              LS
            </div>
            <div>
              <h1 className="text-2xl font-black">Admin Panel</h1>
              <p className="text-xs text-slate-400">LeadScrap</p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-black mb-2">Acesso Admin</h2>
          <p className="text-slate-300 mb-8">Apenas administradores da LS ViraWeb</p>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-200 text-sm font-bold"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Email</label>
              <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                <Mail size={18} className="text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@viraweb.online"
                  className="bg-transparent w-full outline-none text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Senha</label>
              <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                <Lock size={18} className="text-slate-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Sua senha"
                  className="bg-transparent w-full outline-none text-white placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mt-8"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-100">
            <p className="font-bold mb-2">ℹ️ Painel Administrativo</p>
            <p className="text-xs">Use suas credenciais de administrador para acessar o painel de aprovações e estatísticas.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
