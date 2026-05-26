'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { 
  ArrowRight, Sparkles, Zap, Shield, TrendingUp, CheckCircle, 
  MessageCircle, X, Loader2, Send, Globe, Target, BarChart3, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });
  const [loading, setLoading] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.whatsapp) {
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
      setFormData({ name: '', email: '', whatsapp: '' });
      setShowWhatsAppModal(true);
    } catch (error) {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-slate-200/50 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              LeadScrap
              <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-white px-2 py-0.5 rounded-full ml-2">PRO</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Recursos</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Como Funciona</a>
            <button
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-black uppercase tracking-widest"
              >
                <Sparkles size={14} className="text-amber-500" />
                Transforme Sua Prospecção em 24h
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]"
              >
                Gere <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">Leads Infinitos</span> e venda enquanto dorme.
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl"
              >
                Extraia contatos qualificados do Google Maps e dispare campanhas no WhatsApp em massa com proteção anti-ban militar. Sua máquina de vendas automatizada.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-1"
                >
                  Garantir Acesso <ArrowRight size={20} />
                </button>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-900 font-bold text-lg rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-slate-50"
                >
                  <TrendingUp size={20} className="text-blue-500" /> Ver Resultados
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-6 pt-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <span className="text-sm font-semibold text-slate-600">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <span className="text-sm font-semibold text-slate-600">Ativação imediata</span>
                </div>
              </motion.div>
            </div>

            {/* 3D Card Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-amber-500/20 rounded-3xl blur-3xl opacity-60" />
              <div className="relative bg-white border border-slate-200 p-8 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl" />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <MessageCircle size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">WhatsApp Conectado</p>
                        <p className="text-xs font-bold text-emerald-500">Proteção ativa</p>
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Hoje</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">2,847</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disparos</p>
                      <p className="text-2xl font-black text-blue-600 mt-1">1,423</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-amber-50 border border-blue-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Shield size={20} className="text-blue-500" />
                      <p className="text-sm font-bold text-slate-900">Anti-Ban Militar: Proteção 100% ativa</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-black text-slate-900">+50k</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Leads Gerados</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-slate-900">98%</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Taxa de Entrega</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-slate-900">24/7</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Operação</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-slate-900">0</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Bloqueios</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-blue-500 font-black text-xs uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full">
              Recursos Poderosos
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Tudo que você precisa para escalar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Extração do Maps",
                desc: "Extraia milhares de contatos qualificados do Google Maps em minutos, filtrando por nicho e região.",
                color: "from-blue-500 to-blue-600",
                bg: "bg-blue-50"
              },
              {
                icon: Target,
                title: "Filtro Inteligente",
                desc: "Separa automaticamente celulares de fixos, garantindo apenas contatos aptos para WhatsApp.",
                color: "from-amber-400 to-amber-500",
                bg: "bg-amber-50"
              },
              {
                icon: Shield,
                title: "Anti-Ban Militar",
                desc: "Cooldowns dinâmicos, limites de volume e pausas automatizadas simulam comportamento humano.",
                color: "from-emerald-400 to-emerald-500",
                bg: "bg-emerald-50"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all group hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-amber-500 font-black text-xs uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-full">
              Processo Simples
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              4 passos para sua máquina de vendas
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-amber-200 to-blue-200 -translate-y-1/2" />
            
            {[
              { step: "01", title: "Busque no Maps", desc: "Digite o termo e extraia contatos em segundos.", icon: Globe },
              { step: "02", title: "Conecte WhatsApp", desc: "Escaneie o QR Code e conecte seu chip.", icon: MessageCircle },
              { step: "03", title: "Configure Anti-Ban", desc: "Ajuste proteções para manter seu número seguro.", icon: Shield },
              { step: "04", title: "Dispare e Venda", desc: "Inicie a campanha e veja as vendas chegarem.", icon: TrendingUp }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm relative z-10 hover:shadow-xl transition-all hover:-translate-y-2"
              >
                <span className="absolute -top-4 -right-4 text-6xl font-black text-slate-100 pointer-events-none">{item.step}</span>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                  <item.icon size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Section */}
      <section id="signup" className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 text-center space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Garanta seu acesso agora
                </h2>
                <p className="text-slate-400 mt-4 font-medium">
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
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Seu WhatsApp (com DDD)"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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

              <p className="text-slate-500 text-xs font-medium">
                🔒 Seus dados estão seguros. Não enviamos spam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm font-medium">
            © 2026 LeadScrap. Todos os direitos reservados.
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
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
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
                className="absolute top-4 right-4 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <MessageCircle size={32} className="text-white" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    Próximo passo: WhatsApp
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Para liberar seu acesso, entre em contato agora mesmo pelo WhatsApp:
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

                <p className="text-slate-500 text-xs font-medium">
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
