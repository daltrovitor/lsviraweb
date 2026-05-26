'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

const isSupabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};
import { Mail, Lock, User, ArrowRight, AlertCircle, Database, Check, MapPin, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthProps {
  onSession: () => void;
}

export default function Auth({ onSession }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isConfigured = isSupabaseConfigured();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured || !supabase) {
      setError('Supabase não está configurado. Contate o administrador.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authErr) throw authErr;
        setSuccess('Bem-vindo de volta! Carregando painel...');
        setTimeout(() => {
          onSession();
        }, 1000);
      } else {
        const { error: authErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (authErr) throw authErr;
        setSuccess('Conta criada com sucesso! Você já pode entrar.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao realizar a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Decorative futuristic grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a192f08_1px,transparent_1px),linear-gradient(to_bottom,#0a192f08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Left Panel: 3D Visualization */}
      <div className="hidden md:flex md:w-1/2 bg-navy-900 relative items-center justify-center overflow-hidden border-r border-navy-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 opacity-90 z-0"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse-glow" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl mix-blend-screen animate-pulse-glow" style={{ animationDelay: '1s' }}/>

        {/* 3D Globe Animation */}
        <div className="relative z-10 w-96 h-96 globe-container flex items-center justify-center">
          <div className="globe-sphere">
            {/* Latitude Rings */}
            {[...Array(6)].map((_, i) => (
              <div key={`lat-${i}`} className="globe-ring" style={{ transform: `rotateX(${i * 30}deg)` }}></div>
            ))}
            {/* Longitude Rings */}
            {[...Array(6)].map((_, i) => (
              <div key={`lon-${i}`} className="globe-ring" style={{ transform: `rotateY(${i * 30}deg)` }}></div>
            ))}
          </div>

          {/* Floating UI Elements */}
          <div className="absolute top-10 left-10 floating-element bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Disparo Automático</p>
              <p className="text-white text-sm font-bold mt-0.5">Ativo</p>
            </div>
          </div>

          <div className="absolute bottom-10 right-0 floating-element-delayed bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="bg-gold-500/20 text-gold-400 p-2 rounded-xl">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gold-300 font-bold uppercase tracking-wider">Leads Extraídos</p>
              <p className="text-white text-sm font-bold mt-0.5">+4.582</p>
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Captação & Automação.</h2>
          <p className="text-navy-200 text-sm font-medium max-w-sm leading-relaxed">
            A plataforma definitiva para extrair leads do Google Maps e automatizar seus disparos no WhatsApp com proteção avançada.
          </p>
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative z-10 bg-white/80 backdrop-blur-sm">
        <div className="w-full max-w-md flex flex-col gap-6">
          
          {/* Supabase Missing Warning */}
          {!isConfigured && (
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex flex-col gap-3 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <Database className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Supabase Não Configurado</h4>
                    <p className="text-[11px] text-amber-700/90 mt-1 leading-relaxed">
                      Para habilitar o sistema de contas, histórico de buscas e agendamento seguro, conecte-se ao seu projeto do Supabase.
                    </p>
                  </div>
                </div>
              </motion.div>
          )}

          {/* Logo & Header */}
          <div className="flex flex-col mb-2">
            <div className="w-14 h-14 relative mb-4">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <h1 className="text-3xl font-black text-navy-950 tracking-tight flex items-center gap-2">
              LeadScrap
              <span className="text-[10px] font-bold px-2 py-0.5 bg-gold-400 text-navy-950 rounded-full shadow-sm">
                ViraWeb
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              {isLogin ? 'Bem-vindo de volta! Acesse sua conta.' : 'Crie sua conta e escale seus resultados.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs"
                >
                  <Check size={16} className="shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wide">Nome Completo</label>
                <div className="relative group">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-all text-navy-950 placeholder:text-slate-400 font-medium hover:bg-slate-50"
                  />
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy-900 uppercase tracking-wide">E-mail</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@empresa.com"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-all text-navy-950 placeholder:text-slate-400 font-medium hover:bg-slate-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wide">Senha</label>
                {isLogin && (
                  <span className="text-[11px] text-navy-600 font-semibold cursor-pointer hover:text-navy-900 transition-colors">
                    Esqueceu a senha?
                  </span>
                )}
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-all text-navy-950 placeholder:text-slate-400 font-medium hover:bg-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-4 rounded-xl bg-navy-900 hover:bg-v-blue-600 disabled:opacity-50 text-white font-black text-sm transition-all hover:shadow-lg hover:shadow-navy-900/20 flex items-center justify-center gap-2 active:scale-[0.97]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar no Sistema' : 'Criar minha conta'}
                  <ArrowRight size={18} className={isLogin ? "text-gold-400" : "text-white"} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Tab */}
          <div className="mt-4 text-center text-sm text-slate-500 font-medium">
            {isLogin ? (
              <p>
                Não tem uma conta?{' '}
                <span
                  onClick={() => setIsLogin(false)}
                  className="text-navy-900 font-bold hover:text-gold-500 cursor-pointer transition-colors"
                >
                  Cadastre-se gratuitamente
                </span>
              </p>
            ) : (
              <p>
                Já possui conta?{' '}
                <span
                  onClick={() => setIsLogin(true)}
                  className="text-navy-900 font-bold hover:text-gold-500 cursor-pointer transition-colors"
                >
                  Faça login
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
