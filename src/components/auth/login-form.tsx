'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, AlertCircle, Check, MapPin, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function LoginForm({ redirectTo = '/dashboard', disableAutoRedirect = false }: { redirectTo?: string; disableAutoRedirect?: boolean }) {
  const router = useRouter();
  const { user, loading: authLoading, isApproved, signOut } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (!disableAutoRedirect && !authLoading && user && isApproved) router.replace(redirectTo);
  }, [user, authLoading, isApproved, router, redirectTo, disableAutoRedirect]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const configured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured || !supabase) {
      setError('Supabase não configurado. Verifique o arquivo .env');
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
        router.replace(redirectTo);
        router.refresh();
      } else {
        const { error: authErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (authErr) throw authErr;
        setSuccess('Conta criada! Faça login para continuar.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row tech-bg tech-grid">
      <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center overflow-hidden border-r border-slate-200/60">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-v-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-80 h-80 globe-container flex items-center justify-center">
          <div className="globe-sphere w-full h-full">
            {[...Array(6)].map((_, i) => (
              <div key={`lat-${i}`} className="globe-ring" style={{ transform: `rotateX(${i * 30}deg)` }} />
            ))}
            {[...Array(6)].map((_, i) => (
              <div key={`lon-${i}`} className="globe-ring" style={{ transform: `rotateY(${i * 30}deg)` }} />
            ))}
          </div>
          <div className="absolute top-8 left-8 floating-element glass-panel px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <MessageCircle size={18} />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300/90 font-bold uppercase">Disparo</p>
              <p className="text-white text-sm font-bold">Ativo</p>
            </div>
          </div>
          <div className="absolute bottom-12 right-4 floating-element-delayed glass-panel px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gold-400/20 text-gold-400">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gold-300/90 font-bold uppercase">Leads</p>
              <p className="text-white text-sm font-bold">+4.582</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 right-12 z-10">
          <h2 className="text-2xl font-black text-white tracking-tight">Captação & Automação</h2>
          <p className="text-navy-200 text-sm mt-2 max-w-md leading-relaxed">
            Extraia leads do Google Maps e automatize disparos no WhatsApp com proteção avançada anti-ban.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md glow-border" variant="glass">
          <div className="mb-8">
            <img src="/logo.png" alt="LeadScrap - Plataforma de Automação WhatsApp e Extração de Leads" className="w-12 h-12 mb-4" />
            <h1 className="text-2xl font-black text-gradient-tech flex items-center gap-2">
              LeadScrap
              <Badge variant="gold">ViraWeb</Badge>
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              {isLogin ? 'Acesse seu painel de comando.' : 'Crie sua conta e comece agora.'}
            </p>
          </div>

          {!configured && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
              Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env
            </div>
          )}

          {user && !isApproved && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex flex-col gap-2">
              <span>⏳ Sua conta está pendente de aprovação pelo administrador. Aguarde o contato.</span>
              <button 
                type="button" 
                onClick={async () => {
                  await signOut();
                  router.refresh();
                }} 
                className="text-left text-v-blue-600 font-bold hover:text-gold-500 transition-colors text-xs underline mt-1"
              >
                Sair / Entrar com outra conta
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium"
                >
                  <Check size={16} className="shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {!isLogin && (
              <Input
                label="Nome completo"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                icon={<User size={18} />}
              />
            )}

            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@empresa.com"
              icon={<Mail size={18} />}
            />

            <Input
              label="Senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={18} />}
            />

            <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-2 py-3.5">
              {isLogin ? 'Entrar no Sistema' : 'Criar minha conta'}
              <ArrowRight size={18} className="text-gold-400" />
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6 font-medium">
            {isLogin ? (
              <>
                Não tem conta?{' '}
                <button type="button" onClick={() => setIsLogin(false)} className="text-v-blue-600 font-bold hover:text-gold-500 transition-colors">
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já possui conta?{' '}
                <button type="button" onClick={() => setIsLogin(true)} className="text-v-blue-600 font-bold hover:text-gold-500 transition-colors">
                  Fazer login
                </button>
              </>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}
