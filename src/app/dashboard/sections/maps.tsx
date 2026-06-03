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
  Square as SquareIcon,
  Save,
  Loader2,
  Clock
} from 'lucide-react';
import { socket } from '../../../services/socket';
import { supabase } from '../../../lib/supabase';

export default function MapsSection() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState({
    onlyCellphones: true,
    excludeFixedPhones: true,
    onlyWithInstagramOrWhatsapp: false
  });
  
  const [status, setStatus] = useState<'idle' | 'starting' | 'extracting' | 'completed' | 'error' | 'stopped'>('idle');
  const [results, setResults] = useState<any[]>([]);
  const [logs, setLogs] = useState<{msg: string, time: Date}[]>([]);

  useEffect(() => {
    const onStatus = (s: string) => setStatus(s as any);
    const onLog = (log: any) => setLogs(prev => [...prev, { msg: log.message, time: new Date(log.timestamp) }].slice(-50));
    const onItem = (data: { item: any, current: number, total: number }) => {
      setResults(prev => [...prev, data.item]);
    };

    const onError = (err: any) => {
      console.error('[Socket Error]', err);
      const errMsg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setLogs(prev => [...prev, { msg: `Erro de conexão/servidor: ${errMsg}`, time: new Date() }].slice(-50));
    };

    socket.on('maps-status', onStatus);
    socket.on('maps-log', onLog);
    socket.on('maps-item-scraped', onItem);
    socket.on('error', onError);

    return () => {
      socket.off('maps-status', onStatus);
      socket.off('maps-log', onLog);
      socket.off('maps-item-scraped', onItem);
      socket.off('error', onError);
    };
  }, []);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const startScrape = () => {
    if (!query) return alert('Digite um termo de busca');
    setResults([]);
    setLogs([]);
    socket.emit('start-maps-scrape', {
      query,
      limit,
      ...filters
    });
  };

  const stopScrape = () => {
    socket.emit('stop-maps-scrape');
  };

  const saveToSupabase = async () => {
    if (results.length === 0) return alert('Nenhum lead para salvar');
    if (!supabase) return alert('Supabase não configurado');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Usuário não autenticado');

    try {
      // 1. Criar a busca
      const { data: search, error: searchErr } = await supabase
        .from('scraped_searches')
        .insert({
          user_id: user.id,
          query,
          target_limit: limit,
          found_count: results.length,
          filters
        })
        .select('*')
        .single();
        
      if (searchErr) throw searchErr;

      // 2. Inserir leads
      const leadsToInsert = results.map(r => ({
        search_id: search.id,
        title: r.title,
        address: r.address,
        phone: r.phone,
        website: r.website,
        rating: r.rating,
        category: r.category,
        url: r.url
      }));

      const { error: leadsErr } = await supabase
        .from('scraped_leads')
        .insert(leadsToInsert);

      if (leadsErr) throw leadsErr;
      
      alert('Busca e leads salvos com sucesso no histórico!');
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    }
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const header = 'Nome,Telefone,Endereço,Categoria,Nota,Site,Link Maps\n';
    const rows = results.map(r => 
      `"${r.title || ''}","${r.phone || ''}","${r.address || ''}","${r.category || ''}","${r.rating || ''}","${r.website || ''}","${r.url || ''}"`
    ).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${query.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy-950 tracking-tight">Maps Scraper</h1>
        <p className="text-slate-500 mt-2 font-medium">Extraia leads qualificados do Google Maps com filtros precisos.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Config and Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-navy-950 mb-5 flex items-center gap-2">
              <Search className="text-gold-500" size={20} />
              Configurar Busca
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">O que deseja buscar?</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ex: Clínicas odontológicas em São Paulo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-all text-navy-950"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Meta de Leads</label>
                <div className="relative">
                  <Target size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-all text-navy-950"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1.5 ml-1">
                  O bot fará o máximo de pesquisa possível para atingir essa meta exata.
                </p>
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                  <Filter size={14} /> Filtros de Qualificação
                </label>
                <div className="space-y-2">
                  <button onClick={() => toggleFilter('onlyCellphones')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left">
                    {filters.onlyCellphones ? <CheckSquare className="text-navy-900" size={18} /> : <Square className="text-slate-300" size={18} />}
                    <span className="text-sm font-semibold text-slate-700">Apenas Celulares (Ignora telefones sem 9)</span>
                  </button>
                  <button onClick={() => toggleFilter('excludeFixedPhones')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left">
                    {filters.excludeFixedPhones ? <CheckSquare className="text-navy-900" size={18} /> : <Square className="text-slate-300" size={18} />}
                    <span className="text-sm font-semibold text-slate-700">Excluir Fixos (Garante contatos de WhatsApp)</span>
                  </button>
                  <button onClick={() => toggleFilter('onlyWithInstagramOrWhatsapp')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left">
                    {filters.onlyWithInstagramOrWhatsapp ? <CheckSquare className="text-navy-900" size={18} /> : <Square className="text-slate-300" size={18} />}
                    <span className="text-sm font-semibold text-slate-700">Apenas com Instagram ou Link WA.me</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                {['idle', 'completed', 'error', 'stopped'].includes(status) ? (
                  <button 
                    onClick={startScrape}
                    className="w-full py-4 bg-navy-900 hover:bg-navy-800 text-gold-400 font-black rounded-xl transition-all shadow-lg shadow-navy-900/10 flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    <Play size={18} />
                    Iniciar Extração
                  </button>
                ) : (
                  <button 
                    onClick={stopScrape}
                    className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    <SquareIcon size={18} />
                    Parar Extração
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Logs */}
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl h-64 flex flex-col font-mono relative overflow-hidden">
            <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2 mb-4 shrink-0 relative z-10">
              <Clock size={16} />
              Logs de Extração
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 text-[11px] relative z-10">
              {logs.length === 0 ? (
                <p className="text-slate-600 italic">Aguardando início...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-3 border-b border-slate-800/50 pb-2">
                    <span className="text-slate-500 shrink-0">[{log.time.toLocaleTimeString()}]</span>
                    <span className="text-slate-300 break-words">{log.msg}</span>
                  </div>
                ))
              )}
              {['starting', 'extracting'].includes(status) && (
                <div className="flex gap-3 items-center text-gold-400 py-2">
                  <Loader2 size={12} className="animate-spin shrink-0" />
                  <span className="animate-pulse">Processando...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-full min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-navy-950 flex items-center gap-2">
                <Globe className="text-gold-500" size={20} />
                Leads Encontrados 
                <span className="ml-2 px-2.5 py-0.5 bg-navy-50 text-navy-900 rounded-full text-xs font-black">
                  {results.length} / {limit}
                </span>
              </h2>
              
              <div className="flex gap-2">
                <button 
                  onClick={saveToSupabase}
                  disabled={results.length === 0}
                  className="px-4 py-2 bg-navy-50 hover:bg-navy-100 text-navy-900 font-bold rounded-xl transition-colors disabled:opacity-50 text-xs flex items-center gap-1.5"
                >
                  <Save size={14} /> Salvar Histórico
                </button>
                <button 
                  onClick={exportCSV}
                  disabled={results.length === 0}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-colors disabled:opacity-50 text-xs flex items-center gap-1.5"
                >
                  <Download size={14} /> Exportar CSV
                </button>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <MapPin size={32} className="text-slate-300" />
                </div>
                <h3 className="font-bold text-slate-700 text-lg">Nenhum lead ainda</h3>
                <p className="text-sm text-slate-500 font-medium mt-1 max-w-sm">
                  Configure sua busca na lateral esquerda e inicie a extração para ver os resultados aparecerem aqui em tempo real.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto pr-2">
                <div className="space-y-3">
                  {results.map((r, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-navy-950 text-sm pr-4 group-hover:text-gold-600 transition-colors">{r.title}</h4>
                        <span className="text-[10px] font-black bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full shrink-0">
                          {r.rating || 'N/A'} ⭐
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold block mb-0.5">Telefone</span>
                          <span className="text-slate-700 font-bold">{r.phone || '--'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block mb-0.5">Categoria</span>
                          <span className="text-slate-700 font-medium">{r.category || '--'}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs">
                        <span className="text-slate-400 font-semibold block mb-0.5">Endereço</span>
                        <span className="text-slate-600 truncate block w-full">{r.address || '--'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
