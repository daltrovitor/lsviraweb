# LeadScrap - Guia de Deployment

## 🚀 Arquitetura do Sistema

- **Frontend**: Next.js 14 (React) - `ls.viraweb.online`
- **Admin Dashboard**: Next.js (React) - `adminls.viraweb.online`
- **Backend**: Express.js com Socket.io - Vercel Functions ou Railway
- **Database**: Supabase (PostgreSQL)
- **Autenticação**: JWT + Role-based Access Control (RBAC)

## 📋 Pré-requisitos

1. Conta Supabase (https://supabase.com)
2. Vercel Account (https://vercel.com)
3. Railway Account para Backend (https://railway.app) - OU usar Vercel Serverless
4. Git e Node.js instalados

## 🗄️ Setup do Banco de Dados

### 1. Criar Projeto no Supabase

```bash
# Acessar https://supabase.com e criar um novo projeto
# Pegar as credenciais:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
```

### 2. Executar SQL Schema

1. Ir para SQL Editor no Supabase
2. Executar o script em: `scripts/admin_schema.sql`

```sql
-- Copiar todo o conteúdo de scripts/admin_schema.sql e executar
```

### 3. Criar Admin Inicial

```sql
INSERT INTO users (
  email, 
  password_hash, 
  name, 
  role, 
  status,
  company,
  phone
) VALUES (
  'admin@viraweb.online',
  '$2a$10$YOUR_HASHED_PASSWORD',
  'Admin ViraWeb',
  'admin',
  'approved',
  'ViraWeb',
  '+55 62 9 9246-6109'
);
```

**Para gerar hash da senha**, use:
```bash
node -e "
const bcrypt = require('bcryptjs');
const senha = 'sua_senha_segura';
const hash = bcrypt.hashSync(senha, 10);
console.log(hash);
"
```

## 🔑 Variáveis de Ambiente

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (.env)
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
BAILEYS_STORE=./baileys_store.json
```

## 📚 Deploy no Vercel

### Frontend + Admin Dashboard (Next.js Puro)

```bash
# 1. Login no Vercel
vercel login

# 2. Deploy do projeto
vercel --prod

# 3. Configurar variáveis de ambiente no Vercel Dashboard
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Configuração do Build

O projeto usa Next.js puro para o frontend. O arquivo `vercel.json` já está configurado:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev:next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Configurar Domínios

1. Ir para Vercel Dashboard > Project Settings > Domains
2. Adicionar domínio principal: `ls.viraweb.online`
3. Adicionar subdomain admin: `adminls.viraweb.online`

**Nota**: O middleware em `src/middleware.ts` já trata o roteamento por subdomain automaticamente.

## 🛤️ Deploy do Backend

### Opção 1: Railway (Recomendado)

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Criar projeto
railway init

# 4. Deployar
railway up

# 5. Configurar variáveis de ambiente no Railway Dashboard
```

### Opção 2: Render.com

```bash
# 1. Conectar repositório GitHub
# 2. Criar New Web Service
# 3. Configurar Build Command: npm install && npm run build
# 4. Configurar Start Command: npm run start
# 5. Adicionar Environment Variables
```

## 🌐 Configurar Subdomínios

### DNS Config (seu provedor de domínio)

```
ls.viraweb.online      → CNAME → cname.vercel-dns.com
adminls.viraweb.online → CNAME → cname.vercel-dns.com
api.viraweb.online     → CNAME → railway-app-url (ou seu backend)
```

## 🔄 Fluxo de Usuários

### 1. Login Principal (ls.viraweb.online)
- Usuário faz login na página principal `/`
- Autenticação via Supabase
- Redirecionamento para `/dashboard`

### 2. Dashboard Principal (ls.viraweb.online/dashboard)
- Usuário autenticado acessa dashboard
- Sistema de disparos e extração de leads
- Gestão de campanhas e contatos

### 3. Landing Page (ls.viraweb.online/landing)
- Página de captura de leads acessível em `/landing`
- Usuários preenchem formulário (Nome, Email, WhatsApp)
- Leads salvos na tabela `landing_leads`
- Instruções para contato via WhatsApp após cadastro

### 4. Admin Dashboard (adminls.viraweb.online)
- Admin faz login em `/admin/login` (ou subdomain adminls)
- Visualiza leads da landing page
- Gerencia status dos leads (pending, contacted, converted, lost)
- Acesso direto via WhatsApp para cada lead

## 📊 Métricas no Admin Dashboard

### Estatísticas em Tempo Real
- Total de usuários aprovados
- Aprovações pendentes
- Disparos de hoje
- Contatos processados hoje

### Campos Rastreados
- `last_access`: Última vez que acessou o dashboard
- `sent_count`: Total de mensagens enviadas por campanha
- `total_contacts`: Total de contatos importados
- `created_at`: Data de criação

## 🚨 Monitoramento

### Logs
- Backend: Railway/Render Dashboard
- Frontend: Vercel Analytics
- Banco: Supabase Studio > Logs

### Alertas
```sql
-- Para campaigns com muitos erros:
SELECT * FROM campaigns WHERE error_count > 100;

-- Usuários inativos:
SELECT * FROM users 
WHERE status = 'approved' 
AND last_access < now() - interval '30 days';
```

## 🔒 Segurança

1. **Service Key**: Nunca expor publicamente
2. **JWT**: Usar Bearer tokens no header
3. **CORS**: Configurar apenas domínios permitidos
4. **Rate Limiting**: Implementar em produção
5. **Backup**: Supabase faz backups automáticos

## 📱 Contato de Suporte

**WhatsApp**: (62) 99246-6109

## 🎯 Checklist Final

- [ ] SQL Schema executado no Supabase (incluindo tabela `landing_leads`)
- [ ] Admin inicial criado com role='admin' no Supabase
- [ ] Variáveis de ambiente configuradas no Vercel:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Frontend deployado em ls.viraweb.online
- [ ] Subdomain adminls.viraweb.online configurado
- [ ] Testes de fluxo completo:
  - [ ] Login na página principal (/)
  - [ ] Acesso ao dashboard principal (/dashboard)
  - [ ] Acesso ao landing page (/landing)
  - [ ] Cadastro de lead na landing page
  - [ ] Visualização de leads no admin dashboard
  - [ ] Atualização de status dos leads
- [ ] Monitoramento configurado (Vercel Analytics)
- [ ] Backups automáticos do Supabase ativados

---

**Versão**: 1.0  
**Última atualização**: 2024-05-24
