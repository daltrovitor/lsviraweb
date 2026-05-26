'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, Lock, User, Building, Phone, ArrowRight, CheckCircle2, AlertCircle, Loader2,
  MapPin, Send, Shield, Zap, Sparkles, HelpCircle, Target, Users, Play, Globe,
  BarChart3, CheckCircle, TrendingUp, XCircle, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'register'>('register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não conferem' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          phone: formData.phone,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erro ao criar conta' });
        return;
      }

      setMessage({ 
        type: 'success', 
        text: 'Conta criada com sucesso! Você receberá um WhatsApp ou e-mail quando for aprovado.' 
      });
      setFormData({ name: '', email: '', company: '', phone: '', password: '', confirmPassword: '' });
      setTimeout(() => setActiveTab('info'), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao conectar ao servidor' });
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: "Como o Maps Scraper evita telefones fixos?",
      a: "Nosso bot inteligente lê cada resultado do Google Maps e valida a estrutura do número. Se configurado, ele remove telefones fixos e mantém apenas celulares elegíveis para envio de WhatsApp."
    },
    {
      q: "Vou ser bloqueado no WhatsApp usando esta ferramenta?",
      a: "Toda ferramenta de automação possui riscos, porém o LeadScrap foi construído com as proteções mais avançadas do mercado: cooldowns aleatórios, tempo de descanso por volume de mensagens, janela de horário de funcionamento e limites diários ajustáveis que simulam o comportamento humano."
    },
    {
      q: "Preciso instalar algum software no meu computador?",
      a: "Não. A plataforma é 100% online e baseada na nuvem. Você só precisa acessar o painel pelo navegador, conectar o WhatsApp via QR Code e configurar suas campanhas. Acesse de qualquer lugar do mundo."
    },
    {
      q: "Como funciona o sistema de aprovação de contas?",
      a: "Como prezamos pela integridade do nosso serviço e da nossa infraestrutura, todas as contas passam por uma triagem rápida. Assim que se cadastrar, nossa equipe analisará os dados e entrará em contato para ativar sua licença."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-gold-400 selection:text-navy-900 overflow-x-hidden">
      
      {/* 1. HEADER & HERO SECTION */}
      <div className="relative bg-navy-900 text-white overflow-hidden min-h-[95vh] flex flex-col justify-between">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-v-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-gold-400/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Navigation */}
        <nav className="relative z-20 border-b border-white/5 bg-navy-950/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl p-1.5 flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="LeadScrap Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  LeadScrap
                  <span className="text-[10px] font-black bg-gold-400 text-navy-950 px-2 py-0.5 rounded-full">PRO</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#funciona" className="hidden md:inline text-sm font-semibold text-slate-300 hover:text-white transition-colors">Como Funciona</a>
              <a href="#recursos" className="hidden md:inline text-sm font-semibold text-slate-300 hover:text-white transition-colors">Recursos</a>
              <a href="#depoimentos" className="hidden md:inline text-sm font-semibold text-slate-300 hover:text-white transition-colors">Depoimentos</a>
              <a href="#faq" className="hidden md:inline text-sm font-semibold text-slate-300 hover:text-white transition-colors">Dúvidas</a>
              <Link
                href="/admin/login"
                className="text-xs md:text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl text-white transition-all"
              >
                Painel
              </Link>
              <a
                href="#cadastro"
                className="text-xs md:text-sm font-black bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 px-5 py-2.5 rounded-xl text-navy-950 shadow-lg shadow-gold-500/10 transition-all hover:scale-105"
              >
                Cadastre-se
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Body */}
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 relative z-10 w-full flex-1 flex flex-col justify-center">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-v-blue-500/10 border border-v-blue-400/20 text-v-blue-300 text-xs font-black uppercase tracking-widest animate-pulse shadow-inner shadow-v-blue-500/20">
                <Sparkles size={16} className="text-gold-400" />
                A Revolução da Prospecção B2B Automática
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
                Gere centenas de <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-amber-300 to-yellow-400">Leads Infinitos</span> e venda enquanto dorme.
              </h1>
              
              <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl">
                O único software que extrai contatos ultra-qualificados direto do Google Maps e dispara campanhas no WhatsApp em massa com um motor anti-ban impenetrável. Sua nova máquina de vendas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a 
                  href="#cadastro" 
                  className="px-8 py-4 bg-gradient-to-r from-v-blue-500 to-v-blue-600 hover:from-v-blue-600 hover:to-v-blue-700 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-v-blue-500/30 transition-all hover:-translate-y-1"
                >
                  Criar Conta Gratuita <ArrowRight size={20} />
                </a>
                <a 
                  href="#funciona" 
                  className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-white/10"
                >
                  <Play size={20} className="text-gold-400" /> Ver Como Funciona
                </a>
              </div>
            </div>

            {/* Right Side: Dashboard Mockup Preview */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-v-blue-500/20 to-gold-400/20 rounded-3xl blur-3xl opacity-60" />
              <div className="relative border border-white/10 bg-navy-950/60 backdrop-blur-2xl p-5 rounded-3xl shadow-2xl overflow-hidden aspect-[4/3] flex flex-col justify-between transform transition-transform hover:scale-105 duration-500">
                
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" />
                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                    <Lock size={10} className="text-emerald-400" /> painel.leadscrap.com.br
                  </span>
                  <div className="w-6" />
                </div>

                <div className="flex-1 py-6 flex flex-col justify-center gap-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-inner">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Leads do Maps</span>
                      <span className="text-2xl font-black text-gold-400 mt-1 block">14.892 <span className="text-xs text-gold-400/60 font-medium">extraídos</span></span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-inner">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Disparos Hoje</span>
                      <span className="text-2xl font-black text-white mt-1 block">3.420 <span className="text-xs text-white/60 font-medium">enviados</span></span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shadow-sm border border-emerald-500/30">
                        <Phone size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">WhatsApp Business</span>
                        <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Conectado de forma segura</span>
                      </div>
                    </div>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SOCIAL PROOF / NUMBERS SECTION */}
      <section className="py-12 bg-white border-b border-slate-100 relative z-20 -mt-10 mx-6 rounded-3xl shadow-xl max-w-7xl md:mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8 text-center divide-x divide-slate-100">
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-3xl md:text-5xl font-black text-navy-900">+50k</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Leads Gerados</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-3xl md:text-5xl font-black text-navy-900">98%</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Taxa de Entrega</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-3xl md:text-5xl font-black text-navy-900">24/7</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Operação Contínua</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-3xl md:text-5xl font-black text-navy-900">Zero</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Bloqueios Relatados</p>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM VS SOLUTION SECTION */}
      <section className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-red-500 font-black text-xs uppercase tracking-widest bg-red-100 px-3.5 py-1.5 rounded-full">
              O Problema Atual
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-navy-900 tracking-tight">
              Prospecção manual é lenta, cara e frustrante.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="bg-white border border-red-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                  <XCircle size={20} />
                </div>
                <h3 className="text-xl font-black text-navy-900">O Jeito Antigo</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-slate-600 font-medium">
                  <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  Comprar listas frias e desatualizadas (que não convertem).
                </li>
                <li className="flex gap-3 text-slate-600 font-medium">
                  <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  Gastar horas buscando no Google manualmente.
                </li>
                <li className="flex gap-3 text-slate-600 font-medium">
                  <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  Enviar mensagens de WhatsApp uma a uma (esgotante).
                </li>
                <li className="flex gap-3 text-slate-600 font-medium">
                  <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  Perder chips por bloqueio devido a disparos malfeitos.
                </li>
              </ul>
            </div>

            {/* The LeadScrap Way */}
            <div className="bg-gradient-to-br from-navy-900 to-navy-950 border border-v-blue-500/30 rounded-3xl p-8 shadow-xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <h3 className="text-xl font-black text-white">O Jeito LeadScrap</h3>
              </div>
              <ul className="space-y-4 relative z-10">
                <li className="flex gap-3 text-slate-300 font-medium">
                  <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  Extrair milhares de leads segmentados do Google Maps em minutos.
                </li>
                <li className="flex gap-3 text-slate-300 font-medium">
                  <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  Filtro automático de WhatsApp (só contatos reais).
                </li>
                <li className="flex gap-3 text-slate-300 font-medium">
                  <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  Disparo em massa com variáveis (Oi {`{nome}`}).
                </li>
                <li className="flex gap-3 text-slate-300 font-medium">
                  <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  Sistema antibloqueio e simulação humana imbatível.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GOOGLE MAPS SCRAPER SECTION */}
      <section id="recursos" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <span className="text-v-blue-500 font-black text-xs uppercase tracking-widest bg-v-blue-50 px-3.5 py-1.5 rounded-full">
              Máquina de Leads
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-navy-900 tracking-tight">
              Extraia milhares de telefones de empresas locais no Maps
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              Diga adeus à compra de listas frias. Com o LeadScrap, você extrai leads quentes direto da maior e mais atualizada base de negócios do planeta.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-v-blue-500 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-v-blue-500/20">
                <MapPin size={28} />
              </div>
              <h3 className="text-xl font-black text-navy-900 mb-3">Busca Regionalizada Exata</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Filtre por nicho de atuação e região geográfica exata (ex: 'Academia em Pinheiros, São Paulo'). Capture contatos extremamente focados na sua oferta.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gold-400 text-navy-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-gold-400/20">
                <Target size={28} />
              </div>
              <h3 className="text-xl font-black text-navy-900 mb-3">Filtro Inteligente de Celulares</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Nosso scraper separa automaticamente os números de celulares de telefones fixos, garantindo que sua lista contenha contatos ativos e aptos para WhatsApp.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-navy-900 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-navy-900/20">
                <Globe size={28} />
              </div>
              <h3 className="text-xl font-black text-navy-900 mb-3">Dados Ricos (Insta & Web)</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Valide redes sociais e sites associados ao estabelecimento para qualificar profundamente cada lead antes de formular sua abordagem comercial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHATSAPP MASS SENDING & ANTI-BAN SECTION */}
      <section className="py-24 bg-navy-950 text-white relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-v-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-gold-400/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-5 order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-v-blue-500/20 to-gold-400/10 rounded-3xl blur-2xl opacity-60" />
              <div className="bg-navy-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl space-y-8 relative">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-white">Algoritmo Anti-Ban</h4>
                    <p className="text-emerald-400 text-xs font-bold mt-1">Proteção Militar Ativa</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {[
                    { title: "Cooldown Dinâmico e Aleatório", desc: "Intervalo randômico entre envios configurado por segundo (ex: de 15s a 45s)." },
                    { title: "Limite de Volume por Hora/Dia", desc: "Define o teto de envios a cada 60 minutos para não estressar o chip." },
                    { title: "Janela de Horário e Dias de Descanso", desc: "Impede envios automáticos fora do horário comercial (ex: após as 18h e domingos)." },
                    { title: "Pausa por Fadiga Automatizada", desc: "O robô para por 15 minutos a cada 20 envios simulando pausas humanas reais." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-gold-400 flex items-center justify-center font-bold text-xs shrink-0 mt-1 group-hover:bg-gold-400/20 transition-colors">
                        ✓
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{item.title}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8 text-left order-1 lg:order-2">
              <span className="text-gold-400 font-black text-xs uppercase tracking-widest bg-gold-400/10 px-4 py-2 rounded-full border border-gold-400/20">
                Disparos 100% Seguros
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
                Fale com milhares de clientes todos os dias <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500">sem medo de bloqueios.</span>
              </h2>
              <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed">
                Nosso motor de automação foi projetado exclusivamente para simular o comportamento humano perfeitamente. Configure as variáveis de anti-ban diretamente no painel e deixe o robô trabalhar por você.
              </p>
              
              <div className="pt-6 grid sm:grid-cols-2 gap-4 text-sm text-slate-300 font-bold">
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-v-blue-500/20 text-v-blue-400 flex items-center justify-center shrink-0"><Users size={16} /></div>
                  Personalização dinâmica com variáveis (Olá, {`{nome}`})
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><BarChart3 size={16} /></div>
                  Relatórios em tempo real (Enviados/Falhas)
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 sm:col-span-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0"><CheckCircle size={16} /></div>
                  Importação instantânea de arquivos CSV e integração total
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS SECTION */}
      <section id="funciona" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <span className="text-v-blue-500 font-black text-xs uppercase tracking-widest bg-v-blue-100/40 px-3.5 py-1.5 rounded-full">
              Processo Simples
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-navy-900 tracking-tight">
              Apenas 4 passos para sua máquina de vendas
            </h2>
            <p className="text-slate-500 text-lg font-medium">
              Não precisa ser um expert em tecnologia. Projetamos o LeadScrap para ser incrivelmente intuitivo.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-v-blue-200 via-gold-200 to-v-blue-200 -translate-y-1/2 z-0" />
            
            {[
              { step: "01", title: "Busque no Maps", desc: "Digite o termo desejado e extraia contatos qualificados em segundos.", icon: MapPin, color: "text-v-blue-500", bg: "bg-v-blue-50" },
              { step: "02", title: "Conecte o WhatsApp", desc: "Aponte seu celular para o QR Code e conecte seu chip instantaneamente.", icon: Phone, color: "text-emerald-500", bg: "bg-emerald-50" },
              { step: "03", title: "Ajuste a Segurança", desc: "Configure os atrasos e proteções anti-ban para manter seu número seguro.", icon: Shield, color: "text-gold-500", bg: "bg-amber-50" },
              { step: "04", title: "Venda no Automático", desc: "Inicie a campanha e veja as mensagens e as vendas chegando sozinhas.", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-xl transition-all z-10 hover:-translate-y-2">
                <span className="absolute -top-4 -right-4 text-8xl font-black text-slate-50 group-hover:text-slate-100 transition-colors pointer-events-none select-none z-0">
                  {item.step}
                </span>
                
                <div className={`w-16 h-16 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 relative z-10 shadow-inner`}>
                  <item.icon size={32} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-navy-900 mb-3 relative z-10">{item.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS SECTION */}
      <section id="depoimentos" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-gold-500 font-black text-xs uppercase tracking-widest bg-gold-50 px-3.5 py-1.5 rounded-full">
              Casos Reais
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-navy-900 tracking-tight">
              Quem usa, aprova.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Carlos Silva", role: "Agência de Marketing", txt: "Aumentamos nossa prospecção em 500% na primeira semana. O filtro de celulares do scraper é surreal, só cai número quente." },
              { name: "Mariana Costa", role: "Corretora de Imóveis", txt: "Eu perdia horas procurando clientes. Agora extraio leads de bairros nobres e o robô manda as ofertas. Minhas vendas triplicaram." },
              { name: "Roberto Alves", role: "Dono de Software House", txt: "Já testei outras ferramentas e sempre perdia o chip. O sistema anti-ban do LeadScrap é o mais inteligente que já vi no mercado." }
            ].map((t, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-8 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <Sparkles key={i} size={16} className="text-gold-400 fill-gold-400" />)}
                </div>
                <p className="text-slate-600 font-medium italic mb-8 leading-relaxed">"{t.txt}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center font-black text-navy-900">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-navy-900">{t.name}</h4>
                    <p className="text-xs text-slate-500 font-bold">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. COMPARISON SECTION */}
      <section className="py-24 bg-navy-900 text-white relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Por que somos a melhor escolha?
            </h2>
          </div>

          <div className="bg-navy-950 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-3 p-6 border-b border-white/10 bg-navy-900/50">
              <div className="font-bold text-slate-400">Recurso</div>
              <div className="font-black text-center text-slate-500">Ferramentas Comuns</div>
              <div className="font-black text-center text-gold-400 text-lg flex items-center justify-center gap-2">
                <img src="/logo.png" className="w-6 h-6" alt="LS" /> LeadScrap
              </div>
            </div>
            
            {[
              { feat: "Extração do Maps", common: "Não possui/Lento", ls: "Sim (Ilimitado)" },
              { feat: "Filtro de Fixo vs Celular", common: "Não possui", ls: "Automático & Preciso" },
              { feat: "Sistema Anti-Ban", common: "Básico (Muito Bloqueio)", ls: "Avançado Militar" },
              { feat: "Baseado em Nuvem (Web)", common: "Instalação PC Local", ls: "100% Online" },
              { feat: "Custo-Benefício", common: "Caro + Mensalidades", ls: "Justo & Escalável" }
            ].map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 p-6 border-b border-white/5 hover:bg-white/5 transition-colors">
                <div className="font-semibold text-slate-300 flex items-center">{row.feat}</div>
                <div className="font-medium text-center text-slate-500 flex items-center justify-center">{row.common}</div>
                <div className="font-black text-center text-emerald-400 flex items-center justify-center bg-emerald-500/10 rounded-lg py-2">{row.ls}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. REGISTRATION, FAQ & SUPPORT SECTION */}
      <section id="faq" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            
            {/* Left: FAQ & Support */}
            <div className="lg:col-span-6 space-y-10">
              <div className="space-y-4">
                <span className="text-v-blue-500 font-black text-xs uppercase tracking-widest bg-v-blue-100/50 px-3.5 py-1.5 rounded-full">
                  Suporte & Dúvidas
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-navy-900 tracking-tight leading-tight">
                  Perguntas Frequentes
                </h2>
                <p className="text-slate-500 text-base font-medium leading-relaxed">
                  Tire suas dúvidas ou fale diretamente conosco pelo WhatsApp de suporte.
                </p>
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white shadow-sm">
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left font-black text-navy-900 text-base hover:bg-slate-50 transition-colors focus:outline-none"
                    >
                      <span>{faq.q}</span>
                      <HelpCircle size={18} className={`text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-v-blue-500' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === idx && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="px-6 pb-6 text-sm font-semibold text-slate-500 leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div>
                  <h4 className="font-black text-navy-900 text-lg">Restou alguma dúvida?</h4>
                  <p className="text-slate-500 text-sm font-medium mt-2">Converse com nosso time comercial.</p>
                </div>
                <a 
                  href="https://wa.me/5562992466109"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform hover:-translate-y-1"
                >
                  <Phone size={18} /> Suporte WhatsApp
                </a>
              </div>
            </div>

            {/* Right: Registration Form Card */}
            <div id="cadastro" className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-v-blue-500/20 to-gold-400/20 rounded-3xl blur-3xl opacity-50" />
              <div className="bg-navy-900 text-white border border-navy-800 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden z-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-v-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl p-2 mb-4 flex items-center justify-center shadow-inner">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-2xl font-black">Crie sua conta agora</h3>
                  <p className="text-slate-400 text-sm font-medium mt-2">Dê o primeiro passo para automatizar suas vendas.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 relative z-10 bg-navy-950/50 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${
                      activeTab === 'register'
                        ? 'bg-gradient-to-r from-v-blue-500 to-v-blue-600 text-white shadow-lg shadow-v-blue-500/20'
                        : 'text-slate-400 hover:text-white bg-transparent'
                    }`}
                  >
                    Cadastro Gratuito
                  </button>
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${
                      activeTab === 'info'
                        ? 'bg-gradient-to-r from-gold-400 to-amber-500 text-navy-950 shadow-lg shadow-gold-500/20'
                        : 'text-slate-400 hover:text-white bg-transparent'
                    }`}
                  >
                    Como Ativar?
                  </button>
                </div>

                {activeTab === 'info' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 relative z-10"
                  >
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4 text-amber-200">
                      <AlertCircle className="flex-shrink-0 text-amber-400 mt-1" size={24} />
                      <div>
                        <p className="font-black text-amber-400 text-lg">Processo de Aprovação</p>
                        <p className="font-semibold text-amber-200/80 mt-2 leading-relaxed text-sm">
                          Para manter a qualidade da rede, todas as contas passam por uma rápida análise de segurança. O acesso é liberado em até 2 horas.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-5">
                      <h3 className="font-black text-base text-v-blue-400">⏳ Etapas:</h3>
                      <ul className="space-y-4 text-sm text-slate-300 font-bold">
                        <li className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-v-blue-500/20 text-v-blue-400 flex items-center justify-center text-xs">1</span> Preencher formulário</li>
                        <li className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-v-blue-500/20 text-v-blue-400 flex items-center justify-center text-xs">2</span> Análise da nossa equipe</li>
                        <li className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-v-blue-500/20 text-v-blue-400 flex items-center justify-center text-xs">3</span> Liberação via WhatsApp</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => setActiveTab('register')}
                      className="w-full bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-navy-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:-translate-y-1 text-lg shadow-xl shadow-gold-500/20"
                    >
                      Preencher Cadastro <ArrowRight size={20} />
                    </button>
                  </motion.div>
                )}

                {activeTab === 'register' && (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5 relative z-10"
                  >
                    {message && (
                      <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold border ${
                        message.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/10 border-red-500/20 text-red-300'
                      }`}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <p>{message.text}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                        <div className="flex items-center gap-3 bg-navy-950/80 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-v-blue-500 transition-colors">
                          <User size={16} className="text-slate-500" />
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Seu nome" className="bg-transparent w-full outline-none text-sm text-white placeholder-slate-600 font-semibold" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">E-mail Corporativo</label>
                        <div className="flex items-center gap-3 bg-navy-950/80 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-v-blue-500 transition-colors">
                          <Mail size={16} className="text-slate-500" />
                          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@empresa.com" className="bg-transparent w-full outline-none text-sm text-white placeholder-slate-600 font-semibold" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Empresa</label>
                        <div className="flex items-center gap-3 bg-navy-950/80 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-v-blue-500 transition-colors">
                          <Building size={16} className="text-slate-500" />
                          <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Sua empresa" className="bg-transparent w-full outline-none text-sm text-white placeholder-slate-600 font-semibold" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">WhatsApp</label>
                        <div className="flex items-center gap-3 bg-navy-950/80 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-v-blue-500 transition-colors">
                          <Phone size={16} className="text-slate-500" />
                          <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(11) 99999-9999" className="bg-transparent w-full outline-none text-sm text-white placeholder-slate-600 font-semibold" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Senha</label>
                        <div className="flex items-center gap-3 bg-navy-950/80 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-v-blue-500 transition-colors">
                          <Lock size={16} className="text-slate-500" />
                          <input type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min 6 dígitos" className="bg-transparent w-full outline-none text-sm text-white placeholder-slate-600 font-semibold" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Confirmar Senha</label>
                        <div className="flex items-center gap-3 bg-navy-950/80 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-v-blue-500 transition-colors">
                          <Lock size={16} className="text-slate-500" />
                          <input type="password" required minLength={6} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Repita a senha" className="bg-transparent w-full outline-none text-sm text-white placeholder-slate-600 font-semibold" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-v-blue-500 to-v-blue-600 hover:from-v-blue-600 hover:to-v-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-v-blue-600/20 transition-transform active:scale-95 flex items-center justify-center gap-3 mt-4 text-base hover:-translate-y-1"
                    >
                      {loading ? (
                        <><Loader2 size={20} className="animate-spin" /> Criando Conta...</>
                      ) : (
                        <><CheckCircle2 size={20} className="text-gold-400" /> Solicitar Acesso Imediato</>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-500 text-center font-semibold mt-4">Ao se cadastrar, você concorda com nossos termos de uso.</p>
                  </motion.form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 10. CTA / FOOTER */}
      <footer className="bg-navy-950 pt-20 pb-10 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl font-black text-white mb-6">Pronto para transformar seu negócio?</h2>
          <a href="#cadastro" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold-400 hover:bg-gold-500 text-navy-950 font-black rounded-xl shadow-xl shadow-gold-500/20 transition-transform hover:-translate-y-1">
            Começar Gratuitamente <ArrowRight size={20} />
          </a>
          
          <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl p-1.5 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">LeadScrap</span>
            </div>
            <p className="text-sm text-slate-500 font-semibold flex items-center gap-2">
              Feito com <Heart size={16} className="text-red-500" /> pela equipe LS ViraWeb © 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
