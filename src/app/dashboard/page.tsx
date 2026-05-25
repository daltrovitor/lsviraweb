'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Auth from '../../components/Auth';
import Navbar from '../../components/Navbar';
import DashboardHome from './sections/home';
import DisparosSection from './sections/disparos';
import MapsSection from './sections/maps';
import GruposSection from './sections/grupos';
import AutomacaoSection from './sections/automacao';

export default function DashboardContainer() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase!.auth.getSession();
        if (error) throw error;
        setSession(data.session);

        const { data: authListener } = supabase!.auth.onAuthStateChange(
          (_event, session) => {
            setSession(session);
          }
        );

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Erro ao checar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-navy-100 border-t-navy-900 rounded-full animate-spin"></div>
        <p className="text-navy-900 font-bold tracking-wider animate-pulse">Carregando LeadScrap...</p>
      </div>
    );
  }

  if (!session) {
    // Passar router.push ou similar para redirecionar caso prefira
    return <Auth onSession={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={() => setSession(null)} 
      />
      
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <DashboardHome />
            </motion.div>
          )}
          {activeTab === 'disparos' && (
            <motion.div key="disparos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <DisparosSection />
            </motion.div>
          )}
          {activeTab === 'maps' && (
            <motion.div key="maps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <MapsSection />
            </motion.div>
          )}
          {activeTab === 'grupos' && (
            <motion.div key="grupos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <GruposSection />
            </motion.div>
          )}
          {activeTab === 'automacao' && (
            <motion.div key="automacao" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AutomacaoSection />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="py-6 text-center text-[11px] text-slate-400 font-medium">
        © 2026 ViraWeb • Todos os direitos reservados
      </footer>
    </div>
  );
}
