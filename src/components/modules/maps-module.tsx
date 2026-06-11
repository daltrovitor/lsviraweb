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
<<<<<<< HEAD
  Compass,
  Sliders,
  Zap,
  Building,
  ChevronRight,
  Database,
  ArrowUpDown,
  Check,
  Terminal,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { socket } from '@/services/socket';
import { supabase } from '@/lib/supabase';
import { ScrapedPlace } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
=======
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
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777

type ScrapeStatus = 'idle' | 'starting' | 'extracting' | 'completed' | 'error' | 'stopped';

export function MapsModule() {
<<<<<<< HEAD
  const router = useRouter();
=======
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState({
    onlyCellphones: true,
<<<<<<< HEAD
    excludeFixedPhones: true,
    onlyWithInstagramOrWhatsapp: false,
  });
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [results, setResults] = useState<ScrapedPlace[]>([]);
  const [logs, setLogs] = useState<{ msg: string; time: Date }[]>([]);
  const [saving, setSaving] = useState(false);

  // Custom filters state to match reference layout
  const [ratingFilter, setRatingFilter] = useState('Todas');
  const [reviewsFilter, setReviewsFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('none');
  const [fastFilterWhats, setFastFilterWhats] = useState(false);
  const [fastFilterSite, setFastFilterSite] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);

=======
    onlyWithInstagramOrWhatsapp: false,
    onlyWithWebsite: false,
    minRating: 0,
    minReviews: 0,
  });
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [results, setResults] = useState<ScrapedPlace[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [saving, setSaving] = useState(false);

>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
  useEffect(() => {
    const onStatus = (s: string) => setStatus(s as ScrapeStatus);
    const onLog = (log: { message: string; timestamp: Date }) =>
      setLogs((prev) => [...prev, { msg: log.message, time: new Date(log.timestamp) }].slice(-50));
    const onItem = (data: { item: ScrapedPlace }) => setResults((prev) => [...prev, data.item]);

<<<<<<< HEAD
    socket.on('maps-status', onStatus);
    socket.on('maps-log', onLog);
    socket.on('maps-item-scraped', onItem);
=======
    const onError = (err: any) => {
      console.error('[Socket Error]', err);
      const errMsg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setLogs((prev) => [...prev, { msg: `Erro de conexão/servidor: ${errMsg}`, time: new Date() }].slice(-50));
    };

    socket.on('maps-status', onStatus);
    socket.on('maps-log', onLog);
    socket.on('maps-item-scraped', onItem);
    socket.on('error', onError);
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777

    return () => {
      socket.off('maps-status', onStatus);
      socket.off('maps-log', onLog);
      socket.off('maps-item-scraped', onItem);
<<<<<<< HEAD
    };
  }, []);

=======
      socket.off('error', onError);
    };
  }, []);

  const toggle = (key: keyof typeof filters) => {
    if (typeof filters[key] === 'boolean') {
      setFilters((p) => ({ ...p, [key]: !p[key] }));
    }
  };

>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
  const startScrape = () => {
    if (!query.trim()) return alert('Digite um termo de busca');
    setResults([]);
    setLogs([]);
<<<<<<< HEAD
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
=======
    socket.emit('start-maps-scrape', {
      query,
      limit,
      onlyCellphones: filters.onlyCellphones,
      excludeFixedPhones: filters.onlyCellphones,
      onlyWithInstagramOrWhatsapp: filters.onlyWithInstagramOrWhatsapp,
      onlyWithWebsite: filters.onlyWithWebsite,
      minRating: filters.minRating,
      minReviews: filters.minReviews
    });
  };

  const saveToSupabase = async () => {
    alert('Sua busca e todos os leads já são salvos automaticamente no histórico em tempo real enquanto a extração está rodando!');
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
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

<<<<<<< HEAD
  const startBulkSending = () => {
    if (results.length === 0) return alert('Nenhum lead detectado para disparar.');
    
    // Filter and map contacts
    const contactsToImport = results
      .filter((r) => r.phone && r.phone.trim() !== '')
      .map((r) => ({
        name: r.title,
        number: r.phone.replace(/\D/g, '') // Keep only digits
      }));
      
    if (contactsToImport.length === 0) {
      return alert('Nenhum lead com telefone celular/válido encontrado.');
    }
    
    localStorage.setItem('pending_disparos_contacts', JSON.stringify(contactsToImport));
    alert(`${contactsToImport.length} contatos prontos para importação! Redirecionando...`);
    router.push('/disparos');
  };

  const running = ['starting', 'extracting'].includes(status);

  // Apply filtering rules in frontend
  const filteredResults = results
    .filter((r) => {
      // Search term filter
      if (searchTerm && !r.title?.toLowerCase().includes(searchTerm.toLowerCase()) && !r.address?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apenas Whats (checks if phone is present)
      if (fastFilterWhats && !r.phone) {
        return false;
      }
      
      // Com Site
      if (fastFilterSite && !r.website) {
        return false;
      }
      
      // Rating filter
      if (ratingFilter !== 'Todas') {
        const itemRating = parseFloat(r.rating) || 0;
        const requiredRating = parseFloat(ratingFilter) || 0;
        if (itemRating < requiredRating) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ranking') {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA;
      }
      return 0;
    });

  return (
    <div className="max-w-[1600px] mx-auto pb-16">
      
      {/* HERO BANNER CARD */}
      <div className="mb-6 rounded-3xl bg-white border border-slate-100 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-[#f3b02c] text-[#0b192c] text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Varredura Intel
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <span className={`w-2 h-2 rounded-full ${running ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              Extração Ilimitada Ativa
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0b192c] tracking-tight">
            Pesquisa Google Maps
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
            Combine o poder da inteligência artificial com varredura em tempo real para extrair leads qualificados diretamente da maior base de dados de empresas do mundo.
          </p>
        </div>
        
        {/* Stylized Right-Side Visual */}
        <div className="shrink-0 flex items-center justify-center">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-50/50 border border-dashed border-blue-200 flex items-center justify-center shadow-inner">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#122a4a] to-[#0b192c] flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-0 transition-transform duration-300">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f3b02c] to-[#e09e22] flex items-center justify-center text-[#0b192c] shadow">
                <Compass size={20} className={running ? 'animate-spin-slow' : ''} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid lg:grid-cols-12 gap-6 relative items-start">
        
        {/* LEFT COLUMN: FILTERS & CONFIGS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-start gap-3 border-b border-slate-50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                <Sliders size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#0b192c] uppercase tracking-tight">Filtros Avançados</h2>
                <p className="text-[11px] text-slate-400 font-semibold">Configure sua extração</p>
              </div>
            </div>

            {/* O QUE VOCÊ BUSCA */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 tracking-wider uppercase block">
                O QUE VOCÊ BUSCA?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Escritórios de advocacia em SP"
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 pl-11 pr-4 py-3.5 text-xs font-bold text-navy-950 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-v-blue-500/25 focus:outline-none transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            {/* META DE LEADS SLIDER */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-500 tracking-wider uppercase">
                  META DE LEADS
                </label>
                <span className="bg-[#0b192c] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {limit} Leads
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0b192c] mt-2 border border-slate-200/50"
              />
            </div>

            {/* REGRAS DE QUALIFICAÇÃO */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-500 tracking-wider uppercase block">
                Regras de qualificação
              </label>
              
              {/* Option 1: Apenas Dispositivos Móveis */}
              <button
                type="button"
                onClick={() => setFilters(p => ({ ...p, onlyCellphones: !p.onlyCellphones }))}
                className={`w-full border rounded-2xl p-3.5 flex items-start gap-3 text-left transition-all duration-200 ${
                  filters.onlyCellphones 
                    ? 'border-v-blue-500/30 bg-v-blue-50/5 shadow-sm' 
                    : 'border-slate-100 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {filters.onlyCellphones ? (
                    <div className="w-5 h-5 rounded-full bg-v-blue-500 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Apenas Dispositivos Móveis</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ignora telefones fixos (VoIP/Landline)</p>
                </div>
              </button>

              {/* Option 2: Social & Web Presence */}
              <button
                type="button"
                onClick={() => setFilters(p => ({ ...p, onlyWithInstagramOrWhatsapp: !p.onlyWithInstagramOrWhatsapp }))}
                className={`w-full border rounded-2xl p-3.5 flex items-start gap-3 text-left transition-all duration-200 ${
                  filters.onlyWithInstagramOrWhatsapp 
                    ? 'border-v-blue-500/30 bg-v-blue-50/5 shadow-sm' 
                    : 'border-slate-100 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {filters.onlyWithInstagramOrWhatsapp ? (
                    <div className="w-5 h-5 rounded-full bg-v-blue-500 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Social & Web Presence</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Prioriza Instagram, LinkedIn ou Site</p>
                </div>
              </button>
            </div>

            {/* DROPDOWNS ROW */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                  NOTA
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-3 text-xs font-bold text-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-v-blue-500/25 transition-all cursor-pointer"
                >
                  <option value="Todas">Todas</option>
                  <option value="4.0+">4.0+</option>
                  <option value="4.5+">4.5+</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                  REVIEWS
                </label>
                <select
                  value={reviewsFilter}
                  onChange={(e) => setReviewsFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-3 text-xs font-bold text-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-v-blue-500/25 transition-all cursor-pointer"
                >
                  <option value="Todas">Todas</option>
                  <option value="10+">10+</option>
                  <option value="50+">50+</option>
                  <option value="100+">100+</option>
                </select>
              </div>
            </div>

            {/* ACTION BUTTON */}
            {!running ? (
              <button
                type="button"
                onClick={startScrape}
                className="w-full bg-[#0b192c] hover:bg-[#122a4a] text-white py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-navy-950/15"
              >
                <Zap size={14} className="text-amber-400 fill-amber-400" />
                Lançar Varredura
              </button>
            ) : (
              <button
                type="button"
                onClick={() => socket.emit('stop-maps-scrape')}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <StopIcon size={14} className="fill-white" />
                Parar Varredura
              </button>
            )}
          </div>

          {/* HISTÓRICO RECENTE */}
          <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-4">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
              HISTÓRICO RECENTE
            </span>
            
            <div className="space-y-2.5">
              {[
                { title: 'Médicos no Rio de Janeiro', leads: 50, links: '2.1k', query: 'Médicos no Rio de Janeiro' },
                { title: 'Estética em São Paulo', leads: 80, links: '5.4k', query: 'Estética em São Paulo' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(item.query);
                    setLimit(item.leads);
                  }}
                  className="w-full flex items-center p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/50 hover:border-slate-100 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-500 border border-slate-100/50 mr-3 shrink-0">
                    <Building size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{item.title}</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                      {item.leads} Leads • {item.links} Links
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LEADS TABLE & CONTROLS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="min-h-[640px] flex flex-col rounded-3xl bg-white border border-slate-100 p-6 shadow-sm relative">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-5 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f3b02c]/10 border border-[#f3b02c]/20 flex items-center justify-center text-[#e09e22]">
                  <Database size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-navy-950 uppercase tracking-tight">Leads Detectados</h2>
                  <p className="text-[11px] text-slate-400 font-semibold">{results.length} empresas encontradas nesta sessão</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!results.length}
                  onClick={exportCSV}
                  className="rounded-2xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Exportar CSV
                </button>
                <button
                  type="button"
                  disabled={!results.length}
                  onClick={startBulkSending}
                  className="rounded-2xl bg-[#0b192c] hover:bg-[#122a4a] px-5 py-2.5 text-xs font-extrabold text-white flex items-center gap-1.5 transition-all shadow-sm shadow-navy-950/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={14} className="text-[#f3b02c] fill-[#f3b02c]" />
                  Iniciar Disparos
                </button>
              </div>
            </div>

            {/* Filter / Search table tools */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Filtrar dados da tabela..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-bold text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-v-blue-500/20"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSortBy(p => p === 'ranking' ? 'none' : 'ranking')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    sortBy === 'ranking' 
                      ? 'bg-v-blue-500/10 text-v-blue-600 border-v-blue-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpDown size={12} />
                  Ordenar por Ranking
                </button>
                
                {/* Switch 1: Apenas Whats */}
                <button
                  type="button"
                  onClick={() => setFastFilterWhats(!fastFilterWhats)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    fastFilterWhats ? 'border-v-blue-500 bg-v-blue-500 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {fastFilterWhats && <Check size={10} className="text-white" strokeWidth={4} />}
                  </div>
                  Apenas Whats
                </button>

                {/* Switch 2: Com Site */}
                <button
                  type="button"
                  onClick={() => setFastFilterSite(!fastFilterSite)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    fastFilterSite ? 'border-v-blue-500 bg-v-blue-500 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {fastFilterSite && <Check size={10} className="text-white" strokeWidth={4} />}
                  </div>
                  Com Site
                </button>
              </div>
            </div>

            {/* Standby / Results display */}
            {filteredResults.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                {/* Concentric radar circle illustration */}
                <div className="relative w-28 h-28 rounded-full border border-dashed border-slate-200 flex items-center justify-center mb-6">
                  <div className="absolute w-20 h-20 rounded-full border border-dashed border-slate-300 flex items-center justify-center" />
                  <div className="absolute w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <Search size={22} className={running ? 'animate-pulse text-v-blue-500' : ''} />
                  </div>
                </div>
                
                <h3 className="font-black text-[#0b192c] text-xs tracking-wider uppercase">SISTEMA EM STANDBY</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-2 max-w-sm leading-relaxed">
                  Nenhum data está sendo processado no momento. Use os filtros à esquerda para iniciar sua primeira varredura inteligente.
                </p>
                
                {!running ? (
                  <button
                    type="button"
                    onClick={startScrape}
                    className="mt-5 bg-[#0b192c] text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-navy-850 transition-all active:scale-98 shadow-sm"
                  >
                    Iniciar Varredura
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-v-blue-600 bg-v-blue-50 px-4 py-2 rounded-xl border border-v-blue-100">
                    <Loader2 className="animate-spin" size={14} />
                    Extraindo leads em tempo real...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-auto space-y-3 pr-1 max-h-[580px]">
                {filteredResults.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50/50 to-white hover:border-v-blue-400/20 hover:shadow-sm transition-all duration-200 animate-fade-in"
                  >
                    <div className="flex justify-between gap-3 mb-2">
                      <h4 className="font-black text-navy-950 text-xs tracking-tight">{r.title}</h4>
                      <span className="text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100/50 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                        ★ {r.rating || '—'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[9px]">Telefone</span>
                        <p className="font-extrabold text-slate-700">{r.phone || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[9px]">Categoria</span>
                        <p className="font-bold text-slate-700 truncate">{r.category || '—'}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400 font-bold block uppercase text-[9px]">Website</span>
                        {r.website ? (
                          <a href={r.website} target="_blank" rel="noreferrer" className="text-v-blue-500 font-bold hover:underline truncate block">
                            {r.website.replace(/https?:\/\/(www\.)?/, '')}
                          </a>
                        ) : (
                          <p className="font-bold text-slate-400">—</p>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 truncate bg-slate-50/40 p-1.5 rounded-lg border border-slate-100/30">
                      📍 {r.address}
                    </p>
=======
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
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggle('onlyCellphones')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left"
                  >
                    {filters.onlyCellphones ? (
                      <CheckSquare className="text-v-blue-600" size={18} />
                    ) : (
                      <Square className="text-slate-300" size={18} />
                    )}
                    <span className="text-sm font-semibold text-slate-700">Apenas Celulares / WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggle('onlyWithInstagramOrWhatsapp')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left"
                  >
                    {filters.onlyWithInstagramOrWhatsapp ? (
                      <CheckSquare className="text-v-blue-600" size={18} />
                    ) : (
                      <Square className="text-slate-300" size={18} />
                    )}
                    <span className="text-sm font-semibold text-slate-700">Com Instagram ou WA.me</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggle('onlyWithWebsite')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left"
                  >
                    {filters.onlyWithWebsite ? (
                      <CheckSquare className="text-v-blue-600" size={18} />
                    ) : (
                      <Square className="text-slate-300" size={18} />
                    )}
                    <span className="text-sm font-semibold text-slate-700">Apenas com Website</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Nota Mínima</label>
                    <select
                      value={filters.minRating}
                      onChange={(e) => setFilters(p => ({ ...p, minRating: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-v-blue-500 transition-colors text-slate-700 font-semibold"
                    >
                      <option value={0}>Sem filtro</option>
                      <option value={4.0}>★ ≥ 4.0</option>
                      <option value={4.5}>★ ≥ 4.5</option>
                      <option value={4.8}>★ ≥ 4.8</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Mínimo Avaliações</label>
                    <select
                      value={filters.minReviews}
                      onChange={(e) => setFilters(p => ({ ...p, minReviews: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-v-blue-500 transition-colors text-slate-700 font-semibold"
                    >
                      <option value={0}>Sem filtro</option>
                      <option value={10}>≥ 10 avaliações</option>
                      <option value={50}>≥ 50 avaliações</option>
                      <option value={100}>≥ 100 avaliações</option>
                    </select>
                  </div>
                </div>
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
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
                  </div>
                ))}
              </div>
            )}
<<<<<<< HEAD
          </div>
        </div>

      </div>

      {/* FLOATING SYSTEM CONSOLE */}
      {consoleOpen ? (
        <div className="fixed bottom-6 right-6 z-40 w-80 rounded-3xl bg-[#0b192c]/95 backdrop-blur-md border border-white/10 shadow-2xl p-5 font-mono text-[10px] text-slate-300 animate-slide-up flex flex-col max-h-72">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 shrink-0">
            <span className="font-black text-white text-[9px] tracking-wider uppercase flex items-center gap-1.5">
              <Terminal size={12} className="text-[#f3b02c]" />
              Console do Sistema
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setConsoleOpen(false)} className="w-2.5 h-2.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
          </div>
          
          {/* Log Area */}
          <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[120px] max-h-48 pr-1 scrollbar-thin">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic">Aguardando varredura iniciar...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-500 shrink-0">[{log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <span className="text-emerald-400 break-words">{log.msg}</span>
                </div>
              ))
            )}
          </div>
          
          {/* Footer stats bar */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-2 text-[9px] font-bold text-slate-400 shrink-0">
            <div>
              TRABALHO: <span className="text-white">{results.length}/{limit}</span>
            </div>
            <div>
              CARGA: <span className="text-white">{running ? '4.8%' : '0%'}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider ${
              running ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/30 text-slate-400'
            }`}>
              {running ? 'ATIVO' : 'STANDBY'}
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConsoleOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#0b192c] hover:bg-navy-800 text-white border border-white/10 w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95"
          title="Abrir console"
        >
          <Terminal size={16} />
        </button>
      )}

=======
          </Card>
        </div>
      </div>
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
    </div>
  );
}
