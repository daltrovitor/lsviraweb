'use client';

import { useState } from 'react';
import { MapPin, Download, Loader2, Search, Globe } from 'lucide-react';

export default function ExtracaoMapsSection() {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-blue-950">Scraping Google Maps</h1>
        <p className="text-slate-500 mt-2">Extraia dados de empresas e contatos do Google Maps</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        {/* Search Form */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-slate-600 block mb-3">Buscar Locais</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ex: Restaurantes em São Paulo, Clínicas em Brasília..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all"
              />
            </div>
            <button
              onClick={() => setLoading(true)}
              disabled={!search || loading}
              className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-yellow-400 font-bold px-6 py-3 rounded-xl text-sm transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Buscar'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Digite o tipo de negócio e localização para extrair dados</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="animate-spin text-blue-900" size={32} />
            <p className="text-slate-500 font-semibold">Buscando no Google Maps...</p>
          </div>
        )}

        {!loading && results.length === 0 && search && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
            <Globe className="mx-auto text-slate-400 mb-3" size={32} />
            <h3 className="font-bold text-slate-800 mb-1">Nenhum resultado encontrado</h3>
            <p className="text-sm text-slate-600">
              Tente uma busca diferente ou seja mais específico
            </p>
          </div>
        )}

        {!loading && results.length === 0 && !search && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center">
            <MapPin className="mx-auto text-blue-900 mb-3" size={32} />
            <h3 className="font-bold text-blue-950 mb-1">Comece uma busca</h3>
            <p className="text-sm text-blue-700">
              Digite um tipo de negócio e localização acima para extrair dados do Google Maps
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-600">{results.length} resultados encontrados</p>
              <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all">
                <Download size={14} />
                Exportar CSV
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800">{result.name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{result.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
