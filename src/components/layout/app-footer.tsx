import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200/60 bg-white/50 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-sm">
              <img src="/logo.png" alt="LeadScrap - Plataforma de Automação WhatsApp e Extração de Leads" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-black text-navy-950 tracking-tight">LeadScrap</p>
              <p className="text-[11px] text-slate-500 font-medium">Captação & automação WhatsApp</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
            <Link href="/dashboard" className="hover:text-v-blue-600 transition-colors">
              Command Center
            </Link>
            <Link href="/disparos" className="hover:text-v-blue-600 transition-colors">
              Disparos
            </Link>
            <Link href="/maps" className="hover:text-v-blue-600 transition-colors">
              Maps Intel
            </Link>
            <Link href="/grupos" className="hover:text-v-blue-600 transition-colors">
              Grupos
            </Link>
            <Link href="/automacao" className="hover:text-v-blue-600 transition-colors">
              Automação
            </Link>
          </nav>

          <div className="text-left md:text-right">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ViraWeb</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">© 2026 · Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
