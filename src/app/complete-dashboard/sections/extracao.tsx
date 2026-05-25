'use client';

import { useState } from 'react';
import { Users, Download, Loader2, RefreshCw, Search } from 'lucide-react';

export default function ExtracaoSection() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-blue-950">Extração de Grupos WhatsApp</h1>
        <p className="text-slate-500 mt-2">Extraia automaticamente membros de grupos WhatsApp e exporte em CSV</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
            <Users size={24} className="text-blue-900" />
            Meus Grupos
          </h2>
          <button
            onClick={() => setLoading(true)}
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar grupos..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="animate-spin text-blue-900" size={32} />
            <p className="text-slate-500 font-semibold">Carregando grupos...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center">
            <Users className="mx-auto text-blue-900 mb-3" size={32} />
            <h3 className="font-bold text-blue-950 mb-1">Nenhum grupo encontrado</h3>
            <p className="text-sm text-blue-700">
              Clique em "Atualizar" para sincronizar seus grupos do WhatsApp
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold">
                    {group.name?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{group.name}</p>
                    <p className="text-xs text-slate-500">{group.size || 0} membros</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all">
                  <Download size={14} />
                  Extrair
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
