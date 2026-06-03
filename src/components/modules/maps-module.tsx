'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Download,
  Globe,
  Target,
  Filter,
  CheckSquare,
  Square,
  Play,
  Square as StopIcon,
  Save,
  Loader2,
} from 'lucide-react';
import { socket } from '@/services/socket';
import { supabase } from '@/lib/supabase';
import { ScrapedPlace } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LogTerminal, LogEntry } from '@/components/ui/log-terminal';

type ScrapeStatus = 'idle' | 'starting' | 'extracting' | 'completed' | 'error' | 'stopped';

export function MapsModule() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState({
    onlyCellphones: true,
    excludeFixedPhones: true,
    onlyWithInstagramOrWhatsapp: false,
  });
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [results, setResults] = useState<ScrapedPlace[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onStatus = (s: string) => setStatus(s as ScrapeStatus);
    const onLog = (log: { message: string; timestamp: Date }) =>
      setLogs((prev) => [...prev, { msg: log.message, time: new Date(log.timestamp) }].slice(-50));
    const onItem = (data: { item: ScrapedPlace }) => setResults((prev) => [...prev, data.item]);

    socket.on('maps-status', onStatus);
    socket.on('maps-log', onLog);
    socket.on('maps-item-scraped', onItem);

    return () => {
      socket.off('maps-status', onStatus);
      socket.off('maps-log', onLog);
      socket.off('maps-item-scraped', onItem);
    };
  }, []);

  const toggle = (key: keyof typeof filters) => setFilters((p) => ({ ...p, [key]: !p[key] }));

  const startScrape = () => {
    if (!query.trim()) return alert('Digite um termo de busca');
    setResults([]);
    setLogs([]);
    socket.emit('start-maps-scrape', { query, limit, ...filters });
  };

  const saveToSupabase = async () => {
    if (results.length === 0) return alert('Nenhum lead');
    if (!supabase) return alert('Supabase não configurado');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Não autenticado');

    setSaving(true);
    try {
      const { data: search, error: searchErr } = await supabase
        .from('map_searches')
        .insert({
          user_id: user.id,
          query,
          total_results: results.length,
        })
        .select('id')
        .single();

      if (searchErr) {
        const fallback = await supabase
          .from('scraped_searches')
          .insert({
            user_id: user.id,
            query,
            target_limit: limit,
            found_count: results.length,
            filters,
          })
          .select('id')
          .single();
        if (fallback.error) throw fallback.error;

        const leads = results.map((r) => ({
          search_id: fallback.data!.id,
          title: r.title,
          address: r.address,
          phone: r.phone,
          website: r.website,
          rating: r.rating,
          category: r.category,
          url: r.url,
        }));
        const { error: leadsErr } = await supabase.from('scraped_leads').insert(leads);
        if (leadsErr) throw leadsErr;
      } else {
        const leads = results.map((r) => ({
          search_id: search!.id,
          title: r.title,
          address: r.address,
          phone: r.phone,
          website: r.website,
          rating: r.rating,
          category: r.category,
          url: r.url,
        }));
        const { error: leadsErr } = await supabase.from('scraped_leads').insert(leads);
        if (leadsErr) throw leadsErr;
      }

      alert('Leads salvos com sucesso!');
    } catch (err: unknown) {
      alert(`Erro: ${err instanceof Error ? err.message : 'Falha ao salvar'}`);
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const header = 'Nome,Telefone,Endereço,Categoria,Nota,Site,Link\n';
    const rows = results
      .map(
        (r) =>
          `"${r.title || ''}","${r.phone || ''}","${r.address || ''}","${r.category || ''}","${r.rating || ''}","${r.website || ''}","${r.url || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads_${query.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    a.click();
  };

  const running = ['starting', 'extracting'].includes(status);

  return (
    <div>
      <PageHeader
        title="Maps Intelligence"
        description="Extraia leads qualificados do Google Maps com filtros avançados."
        action={
          running ? (
            <Badge variant="live" pulse>
              Extraindo
            </Badge>
          ) : null
        }
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card glow>
            <CardTitle className="flex items-center gap-2 mb-5">
              <Search className="text-gold-500" size={20} />
              Configurar busca
            </CardTitle>
            <div className="space-y-4">
              <Input
                label="Termo de busca"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: clínicas em São Paulo"
                icon={<MapPin size={18} />}
              />
              <Input
                label="Meta de leads"
                type="number"
                min={1}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10) || 1)}
                icon={<Target size={18} />}
              />
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <Filter size={12} /> Filtros
                </p>
                {(
                  [
                    ['onlyCellphones', 'Apenas celulares'],
                    ['excludeFixedPhones', 'Excluir telefones fixos'],
                    ['onlyWithInstagramOrWhatsapp', 'Com Instagram ou WA.me'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 mb-2 text-left"
                  >
                    {filters[key] ? (
                      <CheckSquare className="text-v-blue-600" size={18} />
                    ) : (
                      <Square className="text-slate-300" size={18} />
                    )}
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                  </button>
                ))}
              </div>
              {!running ? (
                <Button variant="primary" fullWidth className="py-4" onClick={startScrape}>
                  <Play size={18} className="text-gold-400" />
                  Iniciar extração
                </Button>
              ) : (
                <Button variant="danger" fullWidth className="py-4" onClick={() => socket.emit('stop-maps-scrape')}>
                  <StopIcon size={18} />
                  Parar
                </Button>
              )}
            </div>
          </Card>

          <LogTerminal logs={logs} title="Logs de extração" className="min-h-[200px]" />
        </div>

        <div className="lg:col-span-7">
          <Card className="min-h-[640px] flex flex-col" glow>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <CardTitle className="flex items-center gap-2 !mb-0">
                <Globe className="text-gold-500" size={20} />
                Leads
                <Badge variant="default">
                  {results.length} / {limit}
                </Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={!results.length || saving} onClick={saveToSupabase} loading={saving}>
                  <Save size={14} /> Salvar
                </Button>
                <Button variant="outline" disabled={!results.length} onClick={exportCSV}>
                  <Download size={14} /> CSV
                </Button>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <MapPin size={40} className="text-slate-300 mb-4" />
                <h3 className="font-bold text-slate-700">Nenhum lead ainda</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                  Configure a busca e inicie a extração. Os resultados aparecem aqui em tempo real.
                </p>
                {running && <Loader2 className="mt-4 text-v-blue-500 animate-spin" />}
              </div>
            ) : (
              <div className="flex-1 overflow-auto space-y-3 pr-1">
                {results.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/80 to-white hover:border-v-blue-400/30 transition-all"
                  >
                    <div className="flex justify-between gap-2 mb-2">
                      <h4 className="font-bold text-navy-950 text-sm">{r.title}</h4>
                      <span className="text-[10px] font-black bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full shrink-0">
                        {r.rating || '—'} ★
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold">Telefone</span>
                        <p className="font-bold text-slate-700">{r.phone || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Categoria</span>
                        <p className="font-medium text-slate-700">{r.category || '—'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 truncate">{r.address}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
