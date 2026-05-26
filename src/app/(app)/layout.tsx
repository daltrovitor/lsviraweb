'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSocketSession } from '@/hooks/use-socket-session';
import { AppNavbar } from '@/components/layout/app-navbar';
import { AppFooter } from '@/components/layout/app-footer';
import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, signOut, isConfigured } = useAuth();

  useSocketSession(user);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen tech-bg tech-grid pt-20">
        <PageSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center tech-bg">
        <div className="w-10 h-10 border-4 border-v-blue-500/30 border-t-v-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 tech-bg">
        <div className="glass-panel max-w-md p-8 text-center rounded-2xl">
          <h1 className="text-xl font-black text-navy-950">Supabase não configurado</h1>
          <p className="text-slate-500 text-sm mt-2">Adicione as variáveis de ambiente no arquivo .env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen tech-bg tech-grid flex flex-col">
      <AppNavbar user={user} onSignOut={() => { signOut(); router.replace('/login'); }} />
      <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full animate-fade-up">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
