# LeadScrap - Sistema de Disparo em Massa WhatsApp

## 📱 Visão Geral

LeadScrap é uma plataforma completa para disparar mensagens em massa no WhatsApp com sistema de aprovação de usuários, dashboard administrativo e métricas em tempo real.

### Fluxo Principal

```
Landing Page (Cadastro)
    ↓
Aguarda Aprovação (Admin Dashboard)
    ↓
Dashboard Principal (Disparos)
```

## 🏗️ Estrutura do Projeto

```
disparador/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── layout.tsx             # Layout global
│   │   ├── landing/page.tsx        # Landing page com cadastro
│   │   └── admin/
│   │       ├── login/page.tsx      # Admin login
│   │       └── dashboard/page.tsx  # Admin dashboard
│   ├── components/
│   ├── services/
│   │   └── socket.ts              # Socket.io client
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── utils/
│       ├── supabase.ts            # Supabase config
│       └── numberSanitizer.ts     # Sanitização de números
├── server/
│   ├── index.ts                   # Entry point Express
│   ├── routes/
│   │   ├── auth.ts                # Autenticação (registro/login)
│   │   └── admin.ts               # Rotas de admin
│   ├── services/
│   │   ├── whatsapp.ts            # WhatsApp Baileys
│   │   ├── campaign.ts            # Campanhas
│   │   └── maps-scraper.ts        # Google Maps scraper
│   ├── utils/
│   │   ├── supabase.ts            # Supabase admin
│   │   ├── csv.ts                 # Parser CSV
│   │   └── numberSanitizer.ts     # Sanitização
│   └── types/
│       └── index.ts               # Interfaces backend
├── scripts/
│   └── admin_schema.sql           # Schema do banco
├── public/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── DEPLOYMENT.md                  # Guia de deploy
```

## 🚀 Início Rápido

### 1. Instalação

```bash
# Clonar ou copiar projeto
cd disparador

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env.local
```

### 2. Configurar Supabase

```bash
# 1. Criar projeto em https://supabase.com
# 2. Pegar credenciais e adicionar ao .env.local
# 3. Executar schema SQL em Supabase Studio > SQL Editor
```

### 3. Executar Localmente

```bash
# Terminal 1 - Frontend Next.js
npm run dev

# Terminal 2 - Backend Express
npm run dev  # O script concorrente já inicia ambos

# Acessar:
# - Landing: http://localhost:3000/landing
# - Dashboard: http://localhost:3000
# - Admin: http://localhost:3000/admin/login
```

## 🔐 Sistema de Autenticação

### Registro (Landing Page)

1. Usuário preenche formulário
2. Conta criada com `status: 'pending'`
3. Email enviado (configurável)

### Aprovação (Admin)

1. Admin faz login
2. Vê lista de usuários pendentes
3. Aprova ou rejeita

### Login

1. Usuário faz login apenas se status = `'approved'`
2. Recebe token JWT
3. Pode acessar dashboard

## 📊 Schema do Banco de Dados

### Tabela `users`
```sql
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE
password_hash   VARCHAR(255)
name            VARCHAR(255)
company         VARCHAR(255)
phone           VARCHAR(20)
role            VARCHAR(50)        -- 'user' | 'admin'
status          VARCHAR(50)        -- 'pending' | 'approved' | 'rejected'
approved_by     UUID REFERENCES users(id)
approved_at     TIMESTAMP
last_access     TIMESTAMP          -- Última vez que acessou
created_at      TIMESTAMP
```

### Tabela `campaigns`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
title           VARCHAR(255)
message         TEXT
status          VARCHAR(50)        -- 'idle' | 'running' | 'paused' | 'completed'
total_contacts  INT
sent_count      INT
error_count     INT
pending_count   INT
created_at      TIMESTAMP
```

### Tabela `contacts`
```sql
id              UUID PRIMARY KEY
campaign_id     UUID REFERENCES campaigns(id)
number          VARCHAR(20)
name            VARCHAR(255)
status          VARCHAR(50)        -- 'pending' | 'sent' | 'error'
sent_at         TIMESTAMP
```

### Tabela `access_logs`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
dashboard       VARCHAR(50)        -- 'main' | 'admin'
ip_address      VARCHAR(50)
user_agent      TEXT
created_at      TIMESTAMP
```

## 📈 Métricas do Admin Dashboard

### Visão Geral
- **Total de Usuários**: COUNT de users com status = 'approved'
- **Pendentes**: COUNT de users com status = 'pending'
- **Disparos Hoje**: SUM de campaigns.sent_count hoje
- **Contatos Hoje**: SUM de campaigns.total_contacts hoje

### Aprovações Pendentes
- Email do usuário
- Nome da empresa
- WhatsApp
- Tempo esperando aprovação (em horas)

### Lista de Usuários
- Email, Nome, Status, Último Acesso
- Filtro por status
- Exportar dados (opcional)

## 🔄 Upload de CSV

### Formato Aceito

```csv
number,name
11988887777,João Silva
11966665555,Maria Santos
```

**Ou com separadores alternativos:**
- Vírgula: `,`
- Ponto e vírgula: `;`
- Tab: `\t`

### Processamento

1. Upload via `POST /api/upload-csv`
2. Validação de formato
3. Sanitização de números
4. Importação para campaign
5. Pronto para disparo

## 💬 Integração WhatsApp

### Baileys Integration

```typescript
// Conectar WhatsApp
await whatsappService.init();

// QR Code é gerado automaticamente
// Escanear com celular
// Pronto para disparar
```

### Disparos

- Suporta variáveis: `{nome}`, `{numero}`
- Delay configurável entre mensagens
- Automação com limites por hora/dia
- Pausa automática para evitar bloqueio

## 🛡️ Segurança

### Autenticação
- Senhas com bcryptjs (hash + salt)
- JWT tokens (Bearer)
- Role-based access control (RBAC)

### Rate Limiting
- IP-based (implementar em produção)
- Por usuário (max uploads/min)

### Dados Sensíveis
- SUPABASE_SERVICE_KEY: Nunca expor publicamente
- Usar variáveis de ambiente
- Sanitizar inputs do usuário

## 🚀 Deploy

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções completas de deploy na Vercel.

### Quick Deploy

```bash
# 1. Logar no Vercel
vercel login

# 2. Deploy
vercel --prod

# 3. Configurar variáveis de ambiente no Vercel Dashboard
```

## 📞 Contato

**Suporte WhatsApp**: (62) 99246-6109

## 📝 Changelog

### v1.0 (2024-05-24)
- ✅ Sistema de registro com aprovação
- ✅ Admin dashboard com estatísticas
- ✅ Upload de CSV
- ✅ Integração WhatsApp Baileys
- ✅ Métricas em tempo real
- ✅ Deploy ready

## 📄 Licença

Propriedade da ViraWeb - Todos os direitos reservados.

---

**Desenvolvido por**: ViraWeb  
**Última atualização**: 2024-05-24
