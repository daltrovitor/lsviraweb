'use client';

import { useState } from 'react';
import {
  Send,
  Users,
  MapPin,
  Settings,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardHome from './sections/home';
import AutomacaoSection from './sections/automacao';
import ExtracaoSection from './sections/extracao';
import ExtracaoMapsSection from './sections/extracao-maps';

type TabType = 'home' | 'disparos' | 'automacao' | 'extracao' | 'maps';

const TABS = [
  { id: 'home', label: 'Dashboard', icon: BarChart3 },
  { id: 'disparos', label: 'Disparos', icon: Send },
  { id: 'automacao', label: 'Automação', icon: Settings },
  { id: 'extracao', label: 'Extração Grupos', icon: Users },
  { id: 'maps', label: 'Extração Maps', icon: MapPin },
];

export default function CompleteDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed lg:static top-0 left-0 h-screen bg-blue-950 text-white transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } lg:w-64 overflow-hidden lg:overflow-visible`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-blue-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-slate-50 border border-slate-100">
                <img src="/logo.png" alt="LeadScrap" className="object-contain w-full h-full" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white">LeadScrap</h1>
                <p className="text-[10px] text-blue-300">Bot de Disparos</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                    isActive
                      ? 'bg-yellow-400 text-blue-950 shadow-lg shadow-yellow-400/20'
                      : 'text-blue-100 hover:bg-blue-900 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="p-4 border-t border-blue-900">
            <p className="text-[11px] text-blue-300 font-medium">© 2026 ViraWeb</p>
            <p className="text-[10px] text-blue-400 mt-1">Disparador Inteligente</p>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 lg:hidden z-30"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header Mobile */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="font-bold text-blue-950">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
          </div>
        </div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DashboardHome />
            </motion.div>
          )}

          {activeTab === 'disparos' && (
            <motion.div
              key="disparos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 md:p-8"
            >
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-black text-blue-950 mb-4">Gerenciador de Disparos</h2>
                <p className="text-slate-500 mb-6">
                  Aqui você pode importar contatos, criar campanhas e acompanhar o status dos disparos em tempo real.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                    <Send className="text-blue-900 mb-3" size={32} />
                    <h3 className="font-bold text-blue-950 mb-2">Disparar Mensagens</h3>
                    <p className="text-sm text-blue-700">
                      Envie mensagens em massa com automação inteligente e proteção anti-ban.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6">
                    <Users className="text-emerald-900 mb-3" size={32} />
                    <h3 className="font-bold text-emerald-950 mb-2">Importar Contatos</h3>
                    <p className="text-sm text-emerald-700">
                      Importe listas de contatos em CSV ou extraia de grupos WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'automacao' && (
            <motion.div
              key="automacao"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AutomacaoSection />
            </motion.div>
          )}

          {activeTab === 'extracao' && (
            <motion.div
              key="extracao"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 md:p-8"
            >
              <ExtracaoSection />
            </motion.div>
          )}

          {activeTab === 'maps' && (
            <motion.div
              key="maps"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 md:p-8"
            >
              <ExtracaoMapsSection />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
