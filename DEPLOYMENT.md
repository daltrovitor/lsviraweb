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

### Frontend + Admin Dashboard

```bash
# 1. Login no Vercel
vercel login

# 2. Deploy do projeto
vercel --prod

# 3. Configurar domínios personalizados
# - Ir para Vercel Dashboard
# - Project Settings > Domains
# - Adicionar: ls.viraweb.online
# - Adicionar: adminls.viraweb.online (usar rewrite)
```

### Reescrita de URL para Admin (vercel.json)

```json
{
  "rewrites": [
    { "source": "/admin/:path*", "destination": "/admin/:path*" }
  ]
}
```

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

### 1. Registro (Landing Page: ls.viraweb.online)
- Usuário preenche formulário em `/landing`
- Conta criada com status `pending`
- Email enviado (opcional): "Aguarde aprovação"

### 2. Aprovação (Admin Dashboard: adminls.viraweb.online)
- Admin faz login em `/admin/login`
- Vê usuários pendentes
- Aprova ou rejeita
- Usuário pode fazer login após aprovação

### 3. Dashboard Principal (ls.viraweb.online)
- Usuário aprovado faz login
- Acessa dashboard de campanhas
- Importa contatos via CSV
- Dispara mensagens

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

- [ ] SQL Schema executado no Supabase
- [ ] Admin inicial criado com hash seguro
- [ ] Variáveis de ambiente configuradas
- [ ] Frontend deployado em ls.viraweb.online
- [ ] Admin Dashboard em adminls.viraweb.online
- [ ] Backend deployado (Railway/Render)
- [ ] Testes de fluxo completo:
  - [ ] Registro na landing page
  - [ ] Aprovação no admin dashboard
  - [ ] Login no dashboard principal
  - [ ] Upload de CSV
  - [ ] Disparo de mensagens
- [ ] Monitoramento configurado
- [ ] Backups automáticos ativados

---

**Versão**: 1.0  
**Última atualização**: 2024-05-24
