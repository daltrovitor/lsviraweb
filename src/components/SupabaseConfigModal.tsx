'use client';

import { useState, useEffect } from 'react';
import { Database, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSupabaseConfigured, updateSupabaseCredentials, clearSupabaseCredentials } from '../utils/supabase';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
    if (typeof window !== 'undefined') {
      setUrl(localStorage.getItem('supabase_url') || '');
      setKey(localStorage.getItem('supabase_anon_key') || '');
    }
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!url.trim().startsWith('http')) {
      setError('Por favor, insira uma URL válida do Supabase (começando com http/https).');
      return;
    }

    if (key.trim().length < 20) {
      setError('A chave Anon fornecida parece inválida ou curta demais.');
      return;
    }

    updateSupabaseCredentials(url, key);
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleClear = () => {
    if (confirm('Tem certeza que deseja apagar as credenciais locais do Supabase? Isso desconectará sua conta.')) {
      clearSupabaseCredentials();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-[#eab308]/5 rounded-full blur-2xl" />
            <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-900 shadow-sm">
                  <Database size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Configurar Supabase</h3>
                  <p className="text-xs text-slate-500">Conecte o LeadScrap ao seu banco de dados</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
                  <Check size={16} className="shrink-0 mt-0.5" />
                  <span>Configuração salva com sucesso! Recarregando...</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">SUPABASE_URL</label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://suaconta.supabase.co"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">SUPABASE_ANON_KEY</label>
                <textarea
                  required
                  rows={3}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-800 placeholder:text-slate-400 resize-none font-mono text-[11px]"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl mt-2">
                <strong>Onde encontrar?</strong> Acesse o painel do seu projeto no Supabase, vá em <strong>Project Settings</strong> &gt; <strong>API</strong> e copie as credenciais. Se você adicionar essas variáveis ao seu arquivo <code>.env</code> como <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, o aplicativo se conectará automaticamente.
              </p>

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                {configured ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs transition-all active:scale-95"
                  >
                    Remover Conexão
                  </button>
                ) : (
                  <div />
                )}
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-yellow-400 font-extrabold text-xs transition-all hover:shadow-lg hover:shadow-blue-900/10 flex items-center gap-1.5 active:scale-95"
                  >
                    Salvar e Conectar
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
