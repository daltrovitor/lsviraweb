'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Download, Loader2, RefreshCw } from 'lucide-react';
import { socket } from '@/services/socket';

interface Group {
  id: string;
  name: string;
  size: number;
}

export default function ExtracaoPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchGroups = () => {
    setLoading(true);
    setError('');
    socket.emit('get-groups', (response: any) => {
      setLoading(false);
      if (response?.success) {
        setGroups(response.data);
      } else {
        setError(response?.error || 'Erro ao buscar grupos');
      }
    });
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleExtract = (groupId: string, groupName: string) => {
    setExtractingId(groupId);
    socket.emit('get-group-members', groupId, (response: any) => {
      setExtractingId(null);
      if (response?.success) {
        const members = response.data;
        
        // Cria o conteúdo do CSV com cabeçalho BOM (\uFEFF) para garantir suporte correto a acentos no Excel
        const csvRows = [
          "Numero,Nome,Admin",
          ...members.map((m: any) => `${m.number},"${(m.name || '').replace(/"/g, '""')}",${m.admin ? 'Sim' : 'Nao'}`)
        ];
        const csvContent = "\uFEFF" + csvRows.join("\n");
        
        // Exporta usando Blob para suportar grandes volumes de contatos sem limite de URL do navegador
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `contatos_${groupName.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(response?.error || 'Erro ao extrair contatos');
      }
    });
  };

  const filteredGroups = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-3xl mx-auto text-slate-800 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-2 mb-4 text-center mt-8">
        <h1 className="text-2xl font-black text-blue-950">
          Extração de números
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Selecione um grupo para extrair todos os participantes.
        </p>
      </header>

      {/* Grupos Panel */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[400px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
              <Users size={18} />
            </span>
            <h2 className="text-base font-bold text-blue-950">Grupos {groups.length > 0 && `(${groups.length})`}</h2>
          </div>
          <button 
            onClick={fetchGroups} 
            disabled={loading}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-900 rounded-xl transition-all border border-slate-200 active:scale-95"
            title="Atualizar Grupos"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/15 focus:border-blue-900 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Status de conexão */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-center p-4 rounded-xl mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Aviso WhatsApp não conectado */}
        {!error && groups.length === 0 && !loading && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 mb-4 text-xs font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            WhatsApp not connected
          </div>
        )}

        {/* Lista de Grupos */}
        <div className="flex-1 overflow-y-auto">
          {loading && groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Loader2 className="animate-spin mb-2 text-blue-900" size={24} />
              <span className="text-sm font-medium">Buscando grupos...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-slate-500 border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50">
              <p className="text-sm font-medium">Nenhum grupo encontrado ou carregado.</p>
              <p className="text-xs mt-1 text-slate-400">Conecte o WhatsApp para sincronizar seus grupos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredGroups.map(group => (
                <div key={group.id} className="bg-slate-50 border border-slate-200 hover:border-blue-200 p-4 rounded-xl flex items-center justify-between transition-all hover:shadow-sm">
                  <div className="overflow-hidden pr-4">
                    <h3 className="text-blue-950 font-bold truncate">{group.name || 'Grupo sem nome'}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">{group.size} participantes</p>
                  </div>
                  <button 
                    onClick={() => handleExtract(group.id, group.name)}
                    disabled={extractingId === group.id}
                    className="flex-shrink-0 bg-blue-900 text-yellow-400 hover:bg-blue-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-sm shadow-blue-900/10 disabled:opacity-50"
                  >
                    {extractingId === group.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    Extrair
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
