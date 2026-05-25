'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Building, Phone, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'register'>('info');
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
        text: 'Conta criada com sucesso! Você receberá um email quando for aprovado.' 
      });
      setFormData({ name: '', email: '', company: '', phone: '', password: '', confirmPassword: '' });
      setTimeout(() => setActiveTab('info'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao conectar ao servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <nav className="bg-blue-900/20 backdrop-blur-md border-b border-blue-500/20 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-black">LS</div>
              <h1 className="text-2xl font-black">LeadScrap</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm font-bold text-blue-300 hover:text-blue-200 transition-colors">
                Documentação
              </a>
              <Link
                href="/admin/login"
                className="text-sm font-bold bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-blue-100 hover:bg-white/10 transition-colors"
              >
                Entrar
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                Dispare <span className="text-blue-400">mensagens em massa</span> no WhatsApp
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Automatize suas campanhas de marketing, atendimento e comunicação com facilidade. Contatos importados, mensagens agendadas e relatórios em tempo real.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: '📱', text: 'Dispare para milhares de contatos' },
                  { icon: '⏰', text: 'Agendamentos automáticos' },
                  { icon: '📊', text: 'Relatórios detalhados' },
                  { icon: '🔒', text: 'Segurança em primeiro lugar' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-lg">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-slate-200">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* WhatsApp Contact */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-8">
                <p className="text-sm text-slate-300 mb-3">📞 Dúvidas? Fale conosco no WhatsApp:</p>
                <a 
                  href="https://wa.me/5562992466109"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  💬 (62) 99246-6109
                </a>
              </div>
            </motion.div>

            {/* Right Side - Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 shadow-2xl"
            >
              {/* Tabs */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                    activeTab === 'info'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Informações
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                    activeTab === 'register'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Cadastro
                </button>
              </div>

              {/* Info Tab */}
              {activeTab === 'info' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="flex-shrink-0 text-yellow-400 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold text-yellow-200 mb-1">Aviso Importante</p>
                      <p className="text-sm text-yellow-100/80">
                        Sua conta será criada com status <strong>Pendente</strong>. A equipe de aprovação da LS ViraWeb analisará sua solicitação e entrará em contato em breve.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <h3 className="font-bold text-blue-300 mb-3">⏳ Próximos passos:</h3>
                    <ol className="space-y-2 text-sm text-blue-100/80">
                      <li><span className="font-bold">1.</span> Preencha o formulário de cadastro</li>
                      <li><span className="font-bold">2.</span> Aguarde a aprovação da equipe</li>
                      <li><span className="font-bold">3.</span> Receba um email de confirmação</li>
                      <li><span className="font-bold">4.</span> Faça login e comece a disparar!</li>
                    </ol>
                  </div>

                  <button
                    onClick={() => setActiveTab('register')}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 mt-6"
                  >
                    Começar Cadastro <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

              {/* Register Tab */}
              {activeTab === 'register' && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {message && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${
                      message.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-200'
                        : 'bg-red-500/10 border border-red-500/30 text-red-200'
                    }`}>
                      {message.type === 'success' ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <AlertCircle size={20} />
                      )}
                      <p className="text-sm font-medium">{message.text}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Nome Completo</label>
                    <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                      <User size={18} className="text-slate-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="João Silva"
                        className="bg-transparent w-full outline-none text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Email</label>
                    <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                      <Mail size={18} className="text-slate-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu@email.com"
                        className="bg-transparent w-full outline-none text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Empresa</label>
                    <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                      <Building size={18} className="text-slate-400" />
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Sua Empresa"
                        className="bg-transparent w-full outline-none text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">WhatsApp</label>
                    <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                      <Phone size={18} className="text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(62) 99246-6109"
                        className="bg-transparent w-full outline-none text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Senha</label>
                    <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                      <Lock size={18} className="text-slate-400" />
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="bg-transparent w-full outline-none text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Confirmar Senha</label>
                    <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                      <Lock size={18} className="text-slate-400" />
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Confirme sua senha"
                        className="bg-transparent w-full outline-none text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mt-6"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Criar Conta
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-400 text-center mt-4">
                    Ao se cadastrar, você concorda com nossos termos de serviço
                  </p>
                </motion.form>
              )}
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-blue-500/10 mt-20 py-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8 text-center text-slate-400 text-sm">
            <p>© 2024 LeadScrap by ViraWeb. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
