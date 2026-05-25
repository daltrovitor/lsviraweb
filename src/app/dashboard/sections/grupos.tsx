'use client';

import { useState } from 'react';
import { Users, Download, Loader2, RefreshCw, Search } from 'lucide-react';
import { socket } from '../../../services/socket';

export default function GruposSection() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadGroups = () => {
    setLoading(true);
    socket.emit('get-groups', (response: any) => {
      setLoading(false);
      if (response.success) {
        setGroups(response.data);
      } else {
        alert(`Erro ao carregar grupos: ${response.error}`);
      }
    });
  };

  const handleExtract = (groupId: string, groupName: string) => {
    socket.emit('get-group-members', groupId, (response: any) => {
      if (response.success) {
        const members = response.data;
        if (members.length === 0) return alert('Nenhum membro encontrado');
        
        const header = 'Nome,Numero,Admin\n';
        const rows = members.map((m: any) => 
          `"${m.name || ''}","${m.number || ''}","${m.admin ? 'Sim' : 'Nao'}"`
        ).join('\n');
        
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `grupo_${groupName.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(`Erro ao extrair membros: ${response.error}`);
      }
    });
  };

  const filteredGroups = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy-950 tracking-tight">Extração de Grupos</h1>
        <p className="text-slate-500 mt-2 font-medium">Extraia membros de seus grupos do WhatsApp e exporte em CSV.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-navy-950 flex items-center gap-2">
            <Users size={24} className="text-gold-500" />
            Meus Grupos
          </h2>
          <button
            onClick={loadGroups}
            className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-gold-400 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-navy-900/10 active:scale-95"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Sincronizar
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar grupos por nome..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-all font-medium text-navy-950"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="animate-spin text-navy-900" size={40} />
            <p className="text-slate-500 font-bold">Carregando seus grupos do WhatsApp...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-navy-50 border border-navy-100 rounded-2xl p-12 text-center">
            <Users className="mx-auto text-navy-900 mb-4 opacity-50" size={48} />
            <h3 className="text-xl font-black text-navy-950 mb-2">Nenhum grupo encontrado</h3>
            <p className="text-sm text-navy-700 font-medium">
              Conecte seu WhatsApp e clique em "Sincronizar" para carregar seus grupos.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredGroups.map((group, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-900 flex items-center justify-center font-black text-lg shadow-inner">
                    {group.name?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <p className="font-bold text-navy-950 line-clamp-1">{group.name}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{group.size || 0} participantes</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleExtract(group.id, group.name)}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 font-bold px-4 py-2 rounded-xl text-xs transition-all opacity-0 group-hover:opacity-100"
                >
                  <Download size={16} />
                  Extrair CSV
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
