'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Download, 
  Loader2, 
  Play, 
  Square,
  FileText,
  UserPlus,
  History,
  CheckCircle,
  Filter,
  Check,
  ChevronRight,
  Globe,
  Instagram,
  Star,
  Info
} from 'lucide-react';
import { socket } from '@/services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const isSupabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};
import { sanitizeWhatsAppNumber } from '@/utils/numberSanitizer';

type Place = {
  title: string;
  address: string;
  phone: string;
  website: string;
  rating: string;
  category: string;
  url: string;
};

interface HistorySearch {
  id: string;
  query: string;
  target_limit: number;
  found_count: number;
  created_at: string;
  filters: any;
}

interface MapsPageProps {
  onImportToCampaign?: (csvText: string) => void;
}

export default function ExtracaoMapsPage({ onImportToCampaign }: MapsPageProps) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(15);
  
  // Custom specifications toggles
  const [onlyCellphones, setOnlyCellphones] = useState(true);
  const [excludeFixedPhones, setExcludeFixedPhones] = useState(true);
  const [onlyWithInstagramOrWhatsapp, setOnlyWithInstagramOrWhatsapp] = useState(false);
  const [onlyWithWebsite, setOnlyWithWebsite] = useState(false);
  const [scrapeMinRating, setScrapeMinRating] = useState<number>(0);
  const [scrapeMinReviews, setScrapeMinReviews] = useState<number>(0);

  const [status, setStatus] = useState<'idle' | 'starting' | 'extracting' | 'completed' | 'error' | 'stopped'>('idle');
  const [logs, setLogs] = useState<{ message: string; timestamp: Date }[]>([]);
  const [results, setResults] = useState<Place[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const logEndRef = useRef<HTMLDivElement>(null);

  // History states
  const [history, setHistory] = useState<HistorySearch[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Frontend Filter states
  const [localSearch, setLocalSearch] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterOnlyWhatsApp, setFilterOnlyWhatsApp] = useState(false);
  const [filterOnlyWithWebsite, setFilterOnlyWithWebsite] = useState(false);

  const isConfigured = isSupabaseConfigured();

  // Load history from Supabase
  const fetchHistory = async () => {
    if (!isConfigured || !supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scraped_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Erro ao buscar histórico do Supabase:', err);
    }
  };

  useEffect(() => {
    socket.emit('get-maps-status');
  }, []);

  useEffect(() => {
    fetchHistory();

    const onError = (err: any) => {
      console.error('[Socket Error]', err);
      const errMsg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setLogs(prev => [...prev.slice(-99), { message: `Erro de conexão/servidor: ${errMsg}`, timestamp: new Date() }]);
    };
    socket.on('maps-status', (newStatus: string) => {
      setStatus(newStatus as any);
      if (newStatus === 'starting') {
        setResults([]);
        setProgress({ current: 0, total: 0 });
      }
      
      // Refresh history from Supabase upon completion since it was saved in real-time
      if (newStatus === 'completed') {
        fetchHistory();
      }

      // Restaura o histórico e os leads coletados caso o scraper esteja rodando em background
      if (newStatus === 'extracting') {
        fetchHistory().then(() => {
          setHistory(prevHistory => {
            if (prevHistory.length > 0) {
              const activeSearch = prevHistory[0];
              setSelectedHistoryId(activeSearch.id);
              
              // Buscar leads que já foram inseridos para a busca atual
              if (supabase) {
                supabase
                  .from('scraped_leads')
                  .select('*')
                  .eq('search_id', activeSearch.id)
                  .then(({ data, error }) => {
                    if (!error && data) {
                      setResults(data);
                      setLogs([{ message: `Restaurando status da busca em background: ${data.length} leads já processados...`, timestamp: new Date() }]);
                    }
                  });
              }
            }
            return prevHistory;
          });
        });
      }
    });

    socket.on('maps-log', (log: { message: string; timestamp: Date }) => {
      setLogs(prev => [...prev.slice(-99), log]);
    });

    socket.on('maps-item-scraped', (data: { item: Place | null, current: number, total: number }) => {
      if (data.item) {
        setResults(prev => {
          // Garante que não adiciona duplicados
          if (prev.some(p => p.phone === data.item!.phone && p.title === data.item!.title)) {
            return prev;
          }
          return [...prev, data.item!];
        });
      }
      setProgress({ current: data.current, total: data.total });
    });

    socket.on('error', onError);

    return () => {
      socket.off('maps-status');
      socket.off('maps-log');
      socket.off('maps-item-scraped');
      socket.off('error', onError);
    };
  }, [query, limit, onlyCellphones, excludeFixedPhones, onlyWithInstagramOrWhatsapp, onlyWithWebsite, scrapeMinRating, scrapeMinReviews]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const saveSearchToSupabase = async (searchQuery: string, targetLimit: number, finalLeads: Place[]) => {
    if (!isConfigured || !supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: searchData, error: searchErr } = await supabase
        .from('scraped_searches')
        .insert({
          user_id: user.id,
          query: searchQuery,
          target_limit: targetLimit,
          found_count: finalLeads.length,
          filters: {
            onlyCellphones,
            excludeFixedPhones,
            onlyWithInstagramOrWhatsapp,
            onlyWithWebsite,
            minRating: scrapeMinRating,
            minReviews: scrapeMinReviews
          }
        })
        .select('*')
        .single();

      if (searchErr) throw searchErr;
      if (!searchData) return;

      // 2. Salvar leads em lote
      if (finalLeads.length > 0) {
        const leadsToInsert = finalLeads.map(lead => ({
          search_id: searchData.id,
          title: lead.title,
          address: lead.address || '',
          phone: lead.phone || '',
          website: lead.website || '',
          rating: lead.rating || '',
          category: lead.category || '',
          url: lead.url || ''
        }));

        const { error: leadsErr } = await supabase
          .from('scraped_leads')
          .insert(leadsToInsert);

        if (leadsErr) throw leadsErr;
      }
      
      // Atualizar lista de histórico localmente
      fetchHistory();
    } catch (err) {
      console.error('Erro ao salvar busca no Supabase:', err);
    }
  };

  // Carregar busca antiga do histórico
  const handleLoadHistory = async (search: HistorySearch) => {
    setSelectedHistoryId(search.id);
    setQuery(search.query);
    setLimit(search.target_limit);
    
    // Tentar ler especificações salvas
    if (search.filters) {
      setOnlyCellphones(!!search.filters.onlyCellphones);
      setExcludeFixedPhones(!!search.filters.excludeFixedPhones);
      setOnlyWithInstagramOrWhatsapp(!!search.filters.onlyWithInstagramOrWhatsapp);
      setOnlyWithWebsite(!!search.filters.onlyWithWebsite);
      setScrapeMinRating(Number(search.filters.minRating || 0));
      setScrapeMinReviews(Number(search.filters.minReviews || 0));
    }

    try {
      if (!supabase) return alert('Supabase não configurado');
      const { data, error } = await supabase
        .from('scraped_leads')
        .select('*')
        .eq('search_id', search.id);

      if (error) throw error;
      setResults(data || []);
      setLogs([{ message: `Histórico carregado: ${data?.length || 0} leads encontrados para "${search.query}"`, timestamp: new Date() }]);
      setStatus('idle');
    } catch (err) {
      console.error('Erro ao carregar leads históricos:', err);
      alert('Não foi possível carregar os leads deste histórico.');
    }
  };

  const handleStart = () => {
    if (!query.trim()) return alert('Digite um termo para busca!');
    setSelectedHistoryId(null);
    setResults([]);
    setLogs([{ message: `Iniciando nova pesquisa por "${query}"...`, timestamp: new Date() }]);
    setStatus('starting');
    setProgress({ current: 0, total: limit });
    
    socket.emit('start-maps-scrape', { 
      query, 
      limit,
      onlyCellphones,
      excludeFixedPhones,
      onlyWithInstagramOrWhatsapp,
      onlyWithWebsite,
      minRating: scrapeMinRating,
      minReviews: scrapeMinReviews
    });
  };

  const handleStop = () => {
    socket.emit('stop-maps-scrape');
  };

  // Sanitização dinâmica antes de exportar
  const handleDownloadCsv = () => {
    if (filteredResults.length === 0) return alert('Nenhum resultado para exportar!');
    
    const csvRows = [
      "Nome,Categoria,TelefoneOriginal,TelefoneSanitizado,Avaliação,Endereço,Website",
      ...filteredResults.map(r => {
        const sanitized = sanitizeWhatsAppNumber(r.phone) || 'Invalido';
        return `"${r.title.replace(/"/g, '""')}","${r.category}","${r.phone}","${sanitized}","${r.rating}","${r.address.replace(/"/g, '""')}","${r.website}"`;
      })
    ];
    
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leadscrap_${query.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sanitização e envio para a fila de disparos
  const handleImportToCampaign = () => {
    // Filtra e sanitiza todos os telefones de leads usando regex robusto
    const sanitizedLeads = filteredResults
      .map(r => {
        const clean = sanitizeWhatsAppNumber(r.phone);
        if (!clean) return null;
        return {
          number: clean,
          name: r.title.replace(/[,;]/g, ' ')
        };
      })
      .filter(Boolean) as { number: string; name: string }[];

    if (sanitizedLeads.length === 0) {
      return alert('Nenhum lead com telefone celular válido foi encontrado após a sanitização (ex: faltam dígitos ou fixos foram excluídos).');
    }
    
    if (onImportToCampaign) {
      const csvLines = sanitizedLeads.map(l => `${l.number}, ${l.name}`).join('\n');
      onImportToCampaign(csvLines);
      alert(`Sucesso! ${sanitizedLeads.length} leads foram sanitizados e enviados para a fila de disparo! Vá para a aba "Disparo" para ver seus contatos.`);
    } else {
      localStorage.setItem('ls_pending_imported_contacts', JSON.stringify(sanitizedLeads));
      alert(`Sucesso! ${sanitizedLeads.length} leads foram sanitizados e preparados para importação. Redirecionando para a página de disparos...`);
      window.location.href = '/disparos';
    }
  };

  // dynamic local filtering
  const filteredResults = results.filter(place => {
    // 1. Text search filter
    const matchesSearch = 
      place.title.toLowerCase().includes(localSearch.toLowerCase()) || 
      place.address.toLowerCase().includes(localSearch.toLowerCase()) ||
      place.category.toLowerCase().includes(localSearch.toLowerCase());

    // 2. Minimum Rating filter
    const ratingNum = parseFloat(place.rating) || 0;
    const matchesRating = ratingNum >= minRating;

    // 3. Category Filter
    const matchesCategory = filterCategory === 'Todas' || place.category === filterCategory;

    // 4. WhatsApp / Cellphone check
    const isWhatsApp = place.phone && (place.phone.replace(/\D/g, '').length >= 10);
    const matchesWhatsAppOnly = !filterOnlyWhatsApp || isWhatsApp;

    // 5. Website presence check
    const matchesWebsiteOnly = !filterOnlyWithWebsite || !!place.website;

    return matchesSearch && matchesRating && matchesCategory && matchesWhatsAppOnly && matchesWebsiteOnly;
  });

  // Extract unique categories for filtering dropdown
  const uniqueCategories = ['Todas', ...Array.from(new Set(results.map(r => r.category).filter(Boolean)))];

  const isWorking = status === 'starting' || status === 'extracting';

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto text-slate-800 animate-fade-in">
      
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 pb-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-900 text-yellow-400 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-900/10">
            LS
          </div>
          <div>
            <h1 className="text-2xl font-black text-blue-950 flex items-center gap-2">
              Pesquisa Google Maps
              <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-400 text-blue-950 rounded-full glow-gold">
                PRO Scraper
              </span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Extraia empresas qualificadas, telefones e mídias sociais diretamente do mapa</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: History list & configs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Controls Configs Card */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <h2 className="text-base font-bold text-blue-950 mb-5 flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
                <Search size={16} />
              </span>
              Filtros da Extração
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Termo de Busca</label>
                <input 
                  type="text" 
                  disabled={isWorking}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Clínicas em São Paulo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/15 focus:border-blue-900 transition-all text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block flex justify-between">
                  <span>Limite de Leads</span>
                  <span className="text-blue-900 font-bold">{limit} leads</span>
                </label>
                <input 
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  disabled={isWorking}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                />
              </div>

              {/* Toggle specs container */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3.5 mt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Filter size={10} /> Filtros de Qualificação
                </h4>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900 transition-colors">Apenas Celular / WhatsApp</span>
                    <span className="text-[9px] text-slate-400">Ignora fixos e foca em celulares</span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={isWorking}
                    checked={onlyCellphones}
                    onChange={(e) => setOnlyCellphones(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900 transition-colors">Bloquear Telefones Fixos</span>
                    <span className="text-[9px] text-slate-400">Ignora fixos comerciais (10 dígitos)</span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={isWorking}
                    checked={excludeFixedPhones}
                    onChange={(e) => setExcludeFixedPhones(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900 transition-colors">Instagram ou WhatsApp</span>
                    <span className="text-[9px] text-slate-400">Busca links de redes sociais no site</span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={isWorking}
                    checked={onlyWithInstagramOrWhatsapp}
                    onChange={(e) => setOnlyWithInstagramOrWhatsapp(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900 transition-colors">Apenas com Website</span>
                    <span className="text-[9px] text-slate-400">Filtra locais que possuem website</span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={isWorking}
                    checked={onlyWithWebsite}
                    onChange={(e) => setOnlyWithWebsite(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Nota Mínima</label>
                    <select
                      disabled={isWorking}
                      value={scrapeMinRating}
                      onChange={(e) => setScrapeMinRating(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-900 transition-colors text-slate-700 font-semibold"
                    >
                      <option value={0}>Todas</option>
                      <option value={4.0}>★ ≥ 4.0</option>
                      <option value={4.5}>★ ≥ 4.5</option>
                      <option value={4.8}>★ ≥ 4.8</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Mín. Avaliações</label>
                    <select
                      disabled={isWorking}
                      value={scrapeMinReviews}
                      onChange={(e) => setScrapeMinReviews(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-900 transition-colors text-slate-700 font-semibold"
                    >
                      <option value={0}>Todas</option>
                      <option value={10}>≥ 10 avaliações</option>
                      <option value={50}>≥ 50 avaliações</option>
                      <option value={100}>≥ 100 avaliações</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {!isWorking ? (
                  <button 
                    onClick={handleStart}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-yellow-400 py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-blue-950/15 active:scale-98"
                  >
                    <Play size={16} fill="currentColor" /> Iniciar Varredura
                  </button>
                ) : (
                  <button 
                    onClick={handleStop}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-red-600/10 active:scale-98"
                  >
                    <Square size={16} fill="currentColor" /> Cancelar Busca
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Premium Animated 3D Scraper Radar Widget */}
          <section className="glass-navy p-6 flex flex-col items-center justify-center min-h-[220px] text-center relative overflow-hidden">
            {/* Spinning Radar Animation */}
            {isWorking ? (
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                {/* Outermost pulsing rings */}
                <div className="absolute inset-0 rounded-full border border-yellow-400/20 radar-pulse-ring" />
                <div className="absolute inset-2 rounded-full border border-yellow-400/30 radar-pulse-ring" style={{ animationDelay: '1s' }} />
                
                {/* 3D network nodes */}
                <div className="absolute w-24 h-24 rounded-full border border-dashed border-yellow-400/30 animate-spin" style={{ animationDuration: '10s' }} />
                <div className="absolute w-12 h-12 rounded-full border border-blue-400/30 animate-reverse-spin" style={{ animationDuration: '6s' }} />
                
                {/* Glowing Core */}
                <div className="w-5 h-5 bg-yellow-400 rounded-full glow-gold flex items-center justify-center">
                  <MapPin size={10} className="text-blue-950 animate-bounce" />
                </div>

                {/* Simulated floating elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute right-0 top-0 bg-blue-500/20 text-blue-300 text-[8px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1"
                >
                  <Star size={6} fill="currentColor" /> Capturando...
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-white/5 rounded-full border border-white/10 flex items-center justify-center text-slate-300 shadow-inner mb-2">
                  <MapPin size={28} className="text-yellow-400" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Radar Adormecido</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                  Digite seu termo acima e ative a varredura inteligente para iniciar a busca automatizada no Google Maps.
                </p>
              </div>
            )}

            {isWorking && (
              <div className="flex flex-col gap-1 w-full mt-2">
                <span className="text-white text-xs font-bold">Extraindo {progress.current} de {progress.total} leads</span>
                <div className="w-full bg-white/5 border border-white/10 h-2 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 glow-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* History Search List (Only if Supabase is active) */}
          {isConfigured && history.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-blue-950 mb-4 flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                  <History size={16} />
                </span>
                Buscas Recentes
              </h2>

              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 hide-scrollbar">
                {history.map((search) => (
                  <button
                    key={search.id}
                    onClick={() => handleLoadHistory(search)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group active:scale-98 ${
                      selectedHistoryId === search.id 
                        ? 'border-blue-900 bg-blue-50/50 shadow-sm' 
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="overflow-hidden pr-3">
                      <div className="font-bold text-xs text-slate-800 truncate group-hover:text-blue-950 transition-colors">
                        {search.query}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <span>{new Date(search.created_at).toLocaleDateString('pt-BR')}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="font-semibold text-blue-900">{search.found_count} leads salvos</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-900 transition-colors group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Live Scrap Console */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col min-h-[250px]">
            <h2 className="text-base font-bold text-blue-950 mb-3.5 flex items-center gap-2">
              <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                <FileText size={16} />
              </span>
              Console de Varredura
            </h2>
            <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 flex-1 overflow-y-auto font-mono text-[10px] flex flex-col gap-1.5 h-[180px] border border-slate-800">
              {logs.length === 0 && <p className="text-slate-500 italic">Pronto para iniciar atividades...</p>}
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </section>

        </div>

        {/* Right Column: Scrape results list and advanced grid filtering */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col min-h-[650px] relative overflow-hidden">
            
            {/* Header controls inside results */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 shadow-sm shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-blue-950 flex items-center gap-2">
                    Resultados Encontrados ({filteredResults.length} de {results.length})
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">Use a barra de busca e os seletores abaixo para filtrar em tempo real</p>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={handleDownloadCsv}
                  disabled={filteredResults.length === 0}
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 active:scale-95 shadow-sm"
                >
                  <Download size={14} /> CSV Sanitizado
                </button>
                <button 
                  onClick={handleImportToCampaign}
                  disabled={filteredResults.length === 0}
                  className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-yellow-400 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <UserPlus size={14} /> Enviar para Disparo
                </button>
              </div>
            </div>

            {/* Dynamic Local Filters Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6 items-center">
              
              {/* Search text input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Pesquisar..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 transition-colors text-slate-700"
                />
              </div>

              {/* Category selector */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 transition-colors text-slate-600 font-medium"
                >
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Minimum rating */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <Star size={14} className="text-amber-500 shrink-0" fill="currentColor" />
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full bg-transparent border-none p-0 text-xs focus:outline-none font-medium text-slate-600"
                >
                  <option value={0}>Todas avaliações</option>
                  <option value={4}>★ {'≥'} 4.0</option>
                  <option value={4.5}>★ {'≥'} 4.5</option>
                  <option value={4.8}>★ {'≥'} 4.8</option>
                </select>
              </div>

              {/* Quick switches checkboxes */}
              <div className="flex flex-col gap-1.5 pl-1.5 justify-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterOnlyWhatsApp}
                    onChange={(e) => setFilterOnlyWhatsApp(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-900 rounded focus:ring-blue-900 border-slate-300"
                  />
                  <span className="text-[10px] font-bold text-slate-600">Apenas WhatsApp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterOnlyWithWebsite}
                    onChange={(e) => setFilterOnlyWithWebsite(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-900 rounded focus:ring-blue-900 border-slate-300"
                  />
                  <span className="text-[10px] font-bold text-slate-600">Com Website</span>
                </label>
              </div>
            </div>

            {/* Leads Table Container */}
            <div className="flex-1 overflow-x-auto border border-slate-100 rounded-2xl bg-slate-50/50">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Nome da Empresa</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Telefone</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Website / Mídias</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Categoria</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-center">Avaliação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-16 text-center text-slate-400 font-medium">
                        {isWorking ? (
                          <div className="flex flex-col items-center gap-2 justify-center">
                            <Loader2 className="animate-spin text-blue-900" size={24} />
                            <span>Extraindo e qualificando locais do Maps...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 justify-center">
                            <Info size={24} className="text-slate-300" />
                            <span>Nenhum lead qualificado encontrado para exibição.</span>
                            <span className="text-[10px] text-slate-400 font-normal">Ajuste os filtros ou inicie uma nova varredura.</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  
                  {filteredResults.map((place, idx) => {
                    const isCell = place.phone && (place.phone.replace(/\D/g, '').length >= 10);
                    const cleanPhone = sanitizeWhatsAppNumber(place.phone);
                    
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                        key={idx} 
                        className="bg-white hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-extrabold text-blue-950 truncate max-w-[200px]" title={place.title}>
                            {place.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={place.address}>
                            {place.address}
                          </div>
                        </td>
                        <td className="p-4">
                          {place.phone ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {place.phone}
                              </span>
                              {cleanPhone && (
                                <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 flex items-center gap-0.5 uppercase tracking-tighter">
                                  <Check size={8} /> WhatsApp
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {place.website ? (
                            <div className="flex items-center gap-1.5">
                              {place.website.toLowerCase().includes('instagram.com') ? (
                                <span className="text-[9px] font-extrabold bg-pink-50 text-pink-600 border border-pink-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <Instagram size={10} /> Instagram
                                </span>
                              ) : (
                                <a 
                                  href={place.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all"
                                >
                                  <Globe size={10} /> Website
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 font-semibold truncate max-w-[130px]">{place.category || '-'}</td>
                        <td className="p-4 text-center">
                          {place.rating ? (
                            <span className="text-amber-500 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">
                              ★ {place.rating}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </section>
        </div>

      </div>
    </main>
  );
}
