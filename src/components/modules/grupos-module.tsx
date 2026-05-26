'use client';

import { useState } from 'react';
import { Users, Download, Loader2, RefreshCw, Search } from 'lucide-react';
import { socket } from '@/services/socket';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WaGroup {
  id: string;
  name: string;
  size?: number;
}

export function GruposModule() {
  const [groups, setGroups] = useState<WaGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadGroups = () => {
    setLoading(true);
    socket.emit('get-groups', (response: { success: boolean; data?: WaGroup[]; error?: string }) => {
      setLoading(false);
      if (response.success && response.data) setGroups(response.data);
      else alert(response.error || 'Erro ao carregar grupos');
    });
  };

  const extractMembers = (groupId: string, groupName: string) => {
    socket.emit(
      'get-group-members',
      groupId,
      (response: { success: boolean; data?: { name: string; number: string; admin: boolean }[]; error?: string }) => {
        if (!response.success || !response.data?.length) {
          alert(response.error || 'Nenhum membro');
          return;
        }
        const header = 'Nome,Numero,Admin\n';
        const rows = response.data
          .map((m) => `"${m.name || ''}","${m.number || ''}","${m.admin ? 'Sim' : 'Nao'}"`)
          .join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `grupo_${groupName.replace(/\s+/g, '_')}_${Date.now()}.csv`;
        a.click();
      }
    );
  };

  const filtered = groups.filter((g) => g.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Grupos WhatsApp"
        description="Sincronize grupos e exporte membros em CSV para suas campanhas."
        action={
          <Button variant="primary" onClick={loadGroups} loading={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </Button>
        }
      />

      <Card glow>
        <div className="mb-6">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar grupos…"
            icon={<Search size={18} />}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="animate-spin text-v-blue-500" size={40} />
            <p className="text-slate-500 font-bold">Carregando grupos…</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-slate-50 border border-slate-100">
            <Users className="mx-auto text-slate-300 mb-4" size={48} />
            <CardTitle>Nenhum grupo carregado</CardTitle>
            <p className="text-sm text-slate-500 mt-2">Conecte o WhatsApp e clique em Sincronizar.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-v-blue-400/20 transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-v-blue-500/20 to-gold-400/20 flex items-center justify-center font-black text-navy-900 shrink-0">
                    {group.name?.charAt(0) || 'G'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-navy-950 truncate">{group.name}</p>
                    <p className="text-xs text-slate-500 font-semibold">{group.size || 0} participantes</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  onClick={() => extractMembers(group.id, group.name)}
                >
                  <Download size={16} />
                  CSV
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
