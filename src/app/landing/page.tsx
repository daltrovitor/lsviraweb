'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { 
  ArrowRight, Sparkles, Zap, Shield, TrendingUp, TrendingDown, CheckCircle2, 
  MessageCircle, X, Loader2, Send, Globe, Target, BarChart3, Users,
  MapPin, Smartphone, Bot, Clock, Database, Lock, Rocket, Phone,
  Filter, Radio, Wifi, Cpu, Network, AlertTriangle, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading, isApproved } = useAuth();

  useEffect(() => {
    if (!loading && user && isApproved) {
      router.replace('/dashboard');
    }
  }, [user, loading, isApproved, router]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.whatsapp || !formData.password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/landing/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao enviar cadastro');
        return;
      }

      toast.success('Cadastro realizado com sucesso!');
      setFormData({ name: '', email: '', whatsapp: '', password: '' });
      setShowWhatsAppModal(true);
    } catch (error) {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: MapPin,
      title: "Extração Google Maps",
      desc: "Extraia milhares de contatos qualificados do Google Maps em minutos. Filtre por nicho, região, avaliação e mais. Pare de perder tempo procurando clientes manualmente.",
      problem: "Problema: Prospecção manual é lenta e ineficiente. Você perde horas copiando contatos um por um.",
      color: "from-v-blue-500 to-v-blue-600",
      bg: "bg-v-blue-50",
      borderColor: "border-v-blue-200"
    },
    {
      icon: Filter,
      title: "Filtro Inteligente de Contatos",
      desc: "Separa automaticamente celulares de fixos, remove duplicatas e valida números. Garanta que 100% dos seus leads sejam aptos para WhatsApp.",
      problem: "Problema: Listas sujas com números fixos e duplicatas desperdiçam seu tempo e dinheiro.",
      color: "from-gold-400 to-gold-500",
      bg: "bg-gold-50",
      borderColor: "border-gold-200"
    },
    {
      icon: Shield,
      title: "Anti-Ban Militar",
      desc: "Cooldowns dinâmicos, limites de volume inteligentes, pausas automatizadas e rotação de sessões. Simula comportamento humano com precisão cirúrgica.",
      problem: "Problema: WhatsApp bloqueia seu número por disparos em massa. Perca clientes e dinheiro com banimentos.",
      color: "from-emerald-400 to-emerald-500",
      bg: "bg-emerald-50",
      borderColor: "border-emerald-200"
    },
    {
      icon: Send,
      title: "Disparos em Massa",
      desc: "Envie milhares de mensagens personalizadas com variáveis dinâmicas. Controle velocidade, agende campanhas e monitore em tempo real.",
      problem: "Problema: Enviar mensagens uma por uma é impossível em escala. Você não consegue atender toda a demanda.",
      color: "from-v-blue-500 to-v-blue-600",
      bg: "bg-v-blue-50",
      borderColor: "border-v-blue-200"
    },
    {
      icon: Users,
      title: "Extração de Grupos",
      desc: "Extraia participantes de grupos do WhatsApp automaticamente. Capture contatos qualificados de grupos do seu nicho sem esforço manual.",
      problem: "Problema: Grupos têm ouro mas você não consegue extrair os contatos de forma eficiente.",
      color: "from-gold-400 to-gold-500",
      bg: "bg-gold-50",
      borderColor: "border-gold-200"
    },
    {
      icon: Bot,
      title: "Automação de Respostas",
      desc: "Configure respostas automáticas baseadas em palavras-chave. Qualifique leads 24/7 sem intervenção humana. Nunca perca uma oportunidade.",
      problem: "Problema: Você não consegue responder todos os leads rapidamente. Vendas são perdidas por demora.",
      color: "from-emerald-400 to-emerald-500",
      bg: "bg-emerald-50",
      borderColor: "border-emerald-200"
    },
    {
      icon: Database,
      title: "Gestão de Leads",
      desc: "Organize seus leads em listas, adicione tags, faça buscas avançadas. Tenha controle total do seu funil de vendas em um só lugar.",
      problem: "Problema: Leads espalhados em planilhas e WhatsApp. Você não sabe quem já foi contatado.",
      color: "from-v-blue-500 to-v-blue-600",
      bg: "bg-v-blue-50",
      borderColor: "border-v-blue-200"
    },
    {
      icon: BarChart3,
      title: "Analytics em Tempo Real",
      desc: "Acompanhe taxas de entrega, abertura, resposta e conversão. Dashboards detalhados para otimizar suas campanhas continuamente.",
      problem: "Problema: Sem métricas você não sabe o que funciona. Está atirando no escuro.",
      color: "from-gold-400 to-gold-500",
      bg: "bg-gold-50",
      borderColor: "border-gold-200"
    },
    {
      icon: Lock,
      title: "Segurança de Dados",
      desc: "Criptografia de ponta a ponta, conformidade com LGPD, backups automáticos. Seus dados e dos seus clientes sempre protegidos.",
      problem: "Problema: Perder dados de clientes é desastroso. Planilhas não têm segurança.",
      color: "from-emerald-400 to-emerald-500",
      bg: "bg-emerald-50",
      borderColor: "border-emerald-200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 via-white to-v-blue-50 text-navy-950 font-sans overflow-x-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-v-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-navy-900/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-20 w-32 h-32 bg-v-blue-400/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-navy-100/50 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo1.png" alt="LeadScrap - Plataforma de Automação WhatsApp e Extração de Leads" className="h-12 w-auto object-contain" />
            <span className="text-xl font-black tracking-tight text-navy-950">
              LS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm font-bold text-navy-600 hover:text-navy-950 transition-colors">Recursos</a>
            <a href="#problems" className="text-sm font-bold text-navy-600 hover:text-navy-950 transition-colors">Problemas</a>
            <a href="#contact" className="text-sm font-bold text-navy-600 hover:text-navy-950 transition-colors">Contato</a>
            <a
              href="/login"
              className="px-5 py-2.5 bg-navy-900 hover:bg-navy-950 text-white font-black text-sm rounded-xl shadow-lg shadow-navy-500/20 transition-all hover:scale-105"
            >
              Entrar
            </a>
            <button
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 bg-gradient-to-r from-v-blue-500 to-v-blue-600 hover:from-v-blue-600 hover:to-v-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-v-blue-500/20 transition-all hover:scale-105"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-v-blue-50 border border-v-blue-200 text-v-blue-600 text-xs font-black uppercase tracking-widest"
              >
                <Sparkles size={14} className="text-gold-500" />
                Transforme Sua Prospecção em 24h
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-navy-950 leading-[1.1]"
              >
                Sua Máquina de <span className="text-transparent bg-clip-text bg-gradient-to-r from-v-blue-500 to-v-blue-600">Vendas Automatizada</span> no WhatsApp
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-navy-600 font-medium leading-relaxed max-w-xl"
              >
                Extraia contatos qualificados do Google Maps, dispare campanhas em massa com proteção anti-ban militar e automatize todo o seu funil de vendas. Pare de perder tempo com tarefas manuais.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-gradient-to-r from-v-blue-500 to-v-blue-600 hover:from-v-blue-600 hover:to-v-blue-700 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-v-blue-500/30 transition-all hover:-translate-y-1"
                >
                  Garantir Acesso <ArrowRight size={20} />
                </button>
                <a
                  href="#features"
                  className="px-8 py-4 bg-white border-2 border-navy-200 hover:border-navy-300 text-navy-950 font-bold text-lg rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-navy-50"
                >
                  <TrendingUp size={20} className="text-v-blue-500" /> Ver Recursos
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-6 pt-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-sm font-bold text-navy-600">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-sm font-bold text-navy-600">Ativação imediata</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-sm font-bold text-navy-600">Suporte VIP</span>
                </div>
              </motion.div>
            </div>

            {/* 3D Globe Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-v-blue-500/20 to-gold-500/20 rounded-3xl blur-3xl opacity-60" />
              <div className="relative w-80 h-80 mx-auto">
                <div className="globe-container w-full h-full flex items-center justify-center">
                  <div className="globe-sphere w-full h-full">
                    {[...Array(6)].map((_, i) => (
                      <div key={`lat-${i}`} className="globe-ring" style={{ transform: `rotateX(${i * 30}deg)` }} />
                    ))}
                    {[...Array(6)].map((_, i) => (
                      <div key={`lon-${i}`} className="globe-ring" style={{ transform: `rotateY(${i * 30}deg)` }} />
                    ))}
                  </div>
                  <div className="absolute top-8 left-8 floating-element glass-panel px-4 py-3 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                      <MessageCircle size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-900/90 font-bold uppercase">Disparo</p>
                      <p className="text-navy-950 text-sm font-bold">Ativo</p>
                    </div>
                  </div>
                  <div className="absolute bottom-12 right-4 floating-element-delayed glass-panel px-4 py-3 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gold-400/20 text-gold-400">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-navy-900/90 font-bold uppercase">Leads</p>
                      <p className="text-navy-950 text-sm font-bold">+4.582</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 bg-white/50 border-y border-navy-100/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-black text-navy-950">+50k</p>
              <p className="text-sm font-bold text-navy-500 uppercase tracking-wider mt-2">Leads Gerados</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-navy-950">98%</p>
              <p className="text-sm font-bold text-navy-500 uppercase tracking-wider mt-2">Taxa de Entrega</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-navy-950">24/7</p>
              <p className="text-sm font-bold text-navy-500 uppercase tracking-wider mt-2">Operação</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-navy-950">0</p>
              <p className="text-sm font-bold text-navy-500 uppercase tracking-wider mt-2">Bloqueios</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-v-blue-500 font-black text-xs uppercase tracking-widest bg-v-blue-50 px-4 py-2 rounded-full border border-v-blue-200">
              Recursos Poderosos
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-navy-950 tracking-tight">
              Tudo que você precisa para dominar o mercado
            </h2>
            <p className="text-lg text-navy-600 font-medium max-w-2xl mx-auto">
              Ferramentas profissionais de automação que transformam sua prospecção e vendas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/80 backdrop-blur-xl border border-navy-100/50 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all group hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-black text-navy-950 mb-3">{feature.title}</h3>
                <p className="text-navy-600 font-medium leading-relaxed mb-4">{feature.desc}</p>
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
                  <p className="text-xs font-bold text-red-600 flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    {feature.problem}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section id="problems" className="relative z-10 py-24 px-6 bg-gradient-to-br from-navy-900 to-navy-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-gold-400 font-black text-xs uppercase tracking-widest bg-gold-400/10 px-4 py-2 rounded-full border border-gold-400/30">
              A Realidade do Mercado
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Você está perdendo dinheiro todos os dias
            </h2>
            <p className="text-lg text-navy-300 font-medium max-w-2xl mx-auto">
              Enquanto você faz prospecção manual, seus concorrentes já estão automatizando
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Tempo Perdido",
                desc: "Você gasta 4+ horas por dia copiando contatos manualmente. Isso são 120+ horas por mês jogadas fora."
              },
              {
                icon: AlertTriangle,
                title: "Risco de Bloqueio",
                desc: "Disparos sem proteção = banimento garantido. Perca seu número e todos os contatos salvos."
              },
              {
                icon: TrendingDown,
                title: "Vendas Perdidas",
                desc: "Respostas lentas = clientes perdidos. Você não consegue atender toda a demanda manualmente."
              },
              {
                icon: Database,
                title: "Dados Desorganizados",
                desc: "Leads espalhados em planilhas, WhatsApp e anotações. Sem controle, sem follow-up, sem vendas."
              },
              {
                icon: Target,
                title: "Alvo Errado",
                desc: "Sem filtros inteligentes você atinge quem não é seu cliente. Dinheiro jogado fora em campanhas ineficazes."
              },
              {
                icon: Rocket,
                title: "Sem Escalabilidade",
                desc: "Processos manuais não escalam. Para crescer 10x, você precisaria de 10x mais tempo e equipe."
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl"
              >
                <div className="w-12 h-12 bg-gold-400/10 rounded-xl flex items-center justify-center mb-4">
                  <item.icon size={24} className="text-gold-400" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">{item.title}</h3>
                <p className="text-sm text-navy-300 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-gold-500 font-black text-xs uppercase tracking-widest bg-gold-50 px-4 py-2 rounded-full border border-gold-200">
              Processo Simplificado
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-navy-950 tracking-tight">
              4 passos para sua máquina de vendas
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-v-blue-200 via-gold-200 to-v-blue-200 -translate-y-1/2" />
            
            {[
              { step: "01", title: "Extraia Leads", desc: "Busque no Maps e extraia contatos qualificados em segundos.", icon: Globe },
              { step: "02", title: "Conecte WhatsApp", desc: "Escaneie o QR Code e conecte seu chip com proteção.", icon: Smartphone },
              { step: "03", title: "Configure Campanha", desc: "Crie mensagem, ajuste anti-ban e selecione os leads.", icon: Send },
              { step: "04", title: "Dispare e Venda", desc: "Inicie a automação e veja as vendas chegarem 24/7.", icon: TrendingUp }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/80 backdrop-blur-xl border border-navy-100/50 p-8 rounded-3xl shadow-sm relative z-10 hover:shadow-xl transition-all hover:-translate-y-2"
              >
                <span className="absolute -top-4 -right-4 text-6xl font-black text-navy-100 pointer-events-none">{item.step}</span>
                <div className="w-14 h-14 bg-gradient-to-br from-v-blue-500 to-v-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-v-blue-500/20">
                  <item.icon size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-black text-navy-950 mb-2">{item.title}</h3>
                <p className="text-navy-600 text-sm font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Section */}
      <section id="signup" className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-navy-900 to-navy-950 border border-navy-800 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-v-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 text-center space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Garanta seu acesso agora
                </h2>
                <p className="text-navy-300 mt-4 font-medium">
                  Preencha seus dados e entraremos em contato via WhatsApp para liberar seu acesso.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-v-blue-500/50 focus:border-v-blue-500 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-v-blue-500/50 focus:border-v-blue-500 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Seu WhatsApp (com DDD)"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-v-blue-500/50 focus:border-v-blue-500 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Crie uma senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-v-blue-500/50 focus:border-v-blue-500 transition-all font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-v-blue-500 to-v-blue-600 hover:from-v-blue-600 hover:to-v-blue-700 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-v-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Garantir Acesso <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-navy-400 text-xs font-medium">
                🔒 Seus dados estão seguros. Não enviamos spam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-24 px-6 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-8">
            <div>
              <span className="text-v-blue-500 font-black text-xs uppercase tracking-widest bg-v-blue-50 px-4 py-2 rounded-full border border-v-blue-200">
                Fale Conosco
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-navy-950 tracking-tight mt-4">
                Precisa de ajuda? Entre em contato
              </h2>
              <p className="text-lg text-navy-600 font-medium mt-4">
                Nossa equipe está pronta para atender você no WhatsApp
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-navy-100/50 p-8 rounded-3xl shadow-xl">
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <MessageCircle size={40} className="text-white" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-navy-950 mb-2">
                    Viraweb - Suporte Oficial
                  </h3>
                  <p className="text-navy-600 font-medium">
                    Entre em contato pelo WhatsApp para dúvidas, suporte ou parcerias
                  </p>
                </div>

                <a
                  href="https://wa.me/5562992466109?text=Olá! Gostaria de saber mais sobre o LeadScrap."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-md py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02]"
                >
                  <MessageCircle size={24} />
                  (62) 99246-6109
                </a>

                <div className="flex items-center gap-4 text-sm font-bold text-navy-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>Resposta rápida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>Suporte especializado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>Atendimento 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-navy-100/50 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-navy-500 text-sm font-medium">
            © 2026 LeadScrap by Viraweb. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* WhatsApp Modal */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => setShowWhatsAppModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center hover:bg-navy-200 transition-colors"
              >
                <X size={20} className="text-navy-600" />
              </button>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <MessageCircle size={32} className="text-white" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-navy-950 mb-2">
                    Próximo passo: WhatsApp
                  </h3>
                  <p className="text-navy-600 font-medium leading-relaxed">
                    Para liberar seu acesso, entre em contato agora mesmo com a Viraweb pelo WhatsApp:
                  </p>
                </div>

                <a
                  href="https://wa.me/5562992466109?text=Olá! Acabei de me cadastrar no LeadScrap e gostaria de liberar meu acesso."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02]"
                >
                  <MessageCircle size={24} />
                  (62) 99246-6109
                </a>

                <p className="text-navy-500 text-xs font-medium">
                  Clique acima para abrir o WhatsApp e falar com nossa equipe
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
