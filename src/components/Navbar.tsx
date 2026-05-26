'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Send, 
  MapPin, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { socket } from '../services/socket';
import { WhatsAppStatus } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
}

const TABS = [
  { id: 'home', label: 'Dashboard', icon: BarChart3 },
  { id: 'disparos', label: 'Disparos', icon: Send },
  { id: 'maps', label: 'Maps Scraper', icon: MapPin },
  { id: 'grupos', label: 'Grupos', icon: Users },
  { id: 'automacao', label: 'Automação', icon: Settings },
];

export default function Navbar({ activeTab, setActiveTab, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({ connected: false, state: 'disconnected' });
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    // Escutar status do WhatsApp
    const onStatus = (status: WhatsAppStatus) => {
      setWaStatus(status);
    };
    
    socket.on('whatsapp-status', onStatus);
    // Solicitar status inicial
    socket.emit('get-whatsapp-status');

    return () => {
      socket.off('whatsapp-status', onStatus);
    };
  }, []);

  useEffect(() => {
    // Buscar perfil do usuário no Supabase
    const fetchProfile = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      if (session?.user) {
        const { data } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
          setUserProfile(data);
        } else {
          // Fallback para metadata
          setUserProfile({
            full_name: session.user.user_metadata?.full_name || 'Usuário',
            email: session.user.email
          });
        }
      }
    };
    
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden p-1.5">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-black text-navy-950 flex items-center gap-1.5 leading-none">
                  LeadScrap
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gold-400 text-navy-950 rounded-full">
                    LS
                  </span>
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                      isActive 
                        ? 'text-navy-900 bg-navy-50' 
                        : 'text-slate-500 hover:text-navy-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-gold-500' : ''} />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-gold-400 rounded-t-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right side (Status + Profile) */}
            <div className="hidden md:flex items-center gap-4">
              
              {/* WhatsApp Status Indicator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                waStatus.connected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${waStatus.connected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${waStatus.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                {waStatus.connected ? 'WhatsApp Online' : 'WhatsApp Offline'}
              </div>

              <div className="h-6 w-px bg-slate-200"></div>

              {/* Profile Menu Dropdown */}
              <div className="relative group cursor-pointer flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold border border-navy-200 overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userProfile?.full_name?.charAt(0) || <User size={14} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-navy-950">{userProfile?.full_name?.split(' ')[0] || 'Usuário'}</span>
                  <span className="text-[10px] text-slate-500 leading-none">Conta MVP</span>
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 p-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <p className="text-sm font-bold text-navy-950">{userProfile?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
                  >
                    <LogOut size={16} />
                    Sair do Sistema
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-3">
              {/* WhatsApp Mini Status Mobile */}
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${waStatus.connected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${waStatus.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'text-navy-900 bg-navy-50' 
                        : 'text-slate-500 hover:text-navy-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-gold-500' : ''} />
                    {tab.label}
                  </button>
                );
              })}
              
              <div className="h-px bg-slate-200 my-4" />
              
              <div className="px-4 py-2 mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold border border-navy-200">
                  {userProfile?.full_name?.charAt(0) || <User size={16} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-950">{userProfile?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-slate-500">{userProfile?.email}</p>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
              >
                <LogOut size={18} />
                Sair do Sistema
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
