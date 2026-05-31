'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Send,
  MapPin,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { socket } from '@/services/socket';
import { fetchUserProfile, type UserProfile } from '@/lib/profile';
import type { WhatsAppStatus } from '@/types';
import type { User } from '@supabase/supabase-js';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Command Center', icon: BarChart3, exact: true },
  { href: '/disparos', label: 'Disparos', icon: Send },
  { href: '/maps', label: 'Maps Intel', icon: MapPin },
  { href: '/grupos', label: 'Grupos', icon: Users },
  { href: '/automacao', label: 'Automação', icon: Settings },
];

export function AppNavbar({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({ connected: false, state: 'disconnected' });
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const onStatus = (s: WhatsAppStatus) => setWaStatus(s);
    socket.on('whatsapp-status', onStatus);
    socket.emit('get-whatsapp-status');
    return () => {
      socket.off('whatsapp-status', onStatus);
    };
  }, []);

  useEffect(() => {
    fetchUserProfile(user).then(setProfile);
  }, [user]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/60 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-sm overflow-hidden p-1 group-hover:border-v-blue-400/40 transition-colors">
                  <img src="/logo.png" alt="LeadScrap - Plataforma de Automação WhatsApp e Extração de Leads" className="w-full h-full object-contain" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-base font-black text-navy-950 tracking-tight">LeadScrap</span>
                  <Badge variant="gold" className="ml-1.5 align-middle text-[8px] py-0">
                    LS
                  </Badge>
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200',
                      active ? 'nav-link-active text-navy-950' : 'text-slate-500 hover:text-navy-900 hover:bg-white/60'
                    )}
                  >
                    <Icon size={16} className={active ? 'text-v-blue-500' : ''} />
                    {item.label}
                    {active && (
                      <motion.div
                        layoutId="navPill"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold-400 rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-3 shrink-0">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border',
                  waStatus.connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                )}
              >
                <Phone size={12} />
                {waStatus.connected ? 'WA Online' : 'WA Offline'}
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <div className="relative group">
                <button className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-white/80 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-v-blue-500/20 to-gold-400/20 border border-v-blue-400/30 flex items-center justify-center text-navy-800 font-bold text-sm">
                    {profile?.full_name?.charAt(0) || <UserIcon size={14} />}
                  </div>
                  <span className="text-xs font-bold text-navy-950 max-w-[80px] truncate hidden xl:block">
                    {profile?.full_name?.split(' ')[0] || 'Conta'}
                  </span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-52 glass-panel rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all scale-95 group-hover:scale-100 origin-top-right shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-bold text-navy-950 truncate">{profile?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-slate-500 truncate">{profile?.email || user.email}</p>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/80 border border-slate-200 text-slate-600"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-16 left-0 right-0 z-40 glass-panel border-b border-white/60 lg:hidden shadow-lg"
          >
            <nav className="p-4 space-y-1 max-h-[70vh] overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold',
                      active ? 'nav-link-active' : 'text-slate-600 hover:bg-white/60'
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-bold rounded-xl hover:bg-red-50 mt-2"
              >
                <LogOut size={18} />
                Sair
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
