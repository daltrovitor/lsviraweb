# Background Server

Servidor de background em Node.js com TypeScript para processar tarefas pesadas de Web Scraping e WhatsApp 24/7. Inclui um servidor Express simples para health check (necessário para Render gratuito).

## 🚀 Funcionalidades

- **Health Check HTTP**: Servidor Express na rota `/` retornando "OK" para o Render não derrubar o serviço
- Escuta jobs de scraping via Supabase Realtime
- Processa extração de dados do Google Maps usando Puppeteer
- Salva logs e resultados no Supabase
- Gerencia múltiplos jobs simultâneos
- Graceful shutdown

## 📋 Pré-requisitos

- Node.js 18+
- Supabase Project
- Variáveis de ambiente configuradas

## 🔧 Configuração

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**Importante**: Use `SUPABASE_SERVICE_ROLE_KEY` (não `ANON_KEY`) pois o servidor precisa de permissões administrativas.

## 🗄️ Schema do Banco de Dados

Execute o SQL atualizado no seu Supabase para criar as tabelas necessárias:

```sql
-- As tabelas já estão no arquivo supabase_schema.sql na raiz do projeto
-- scraper_jobs
-- scraper_logs
-- scraper_results
```

## 🏃 Executar Localmente

### Instalar dependências:
```bash
npm install
```

### Compilar TypeScript:
```bash
npm run build
```

### Executar em desenvolvimento:
```bash
npm run dev
```

### Executar em produção:
```bash
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3000` (ou a porta configurada em `PORT`).

## 🚢 Deploy no Render

### 1. Criar Web Service

1. Acesse [render.com](https://render.com)
2. Crie um novo "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Root Directory**: `background-server` (se estiver no mesmo repo)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2. Variáveis de Ambiente

No Render:
- Settings > Environment Variables
- Adicione:
  - `SUPABASE_URL` = URL do seu projeto Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` = Service Role Key do Supabase
  - `PORT` = 10000 (Render usa esta porta por padrão)

### 3. Configurar Puppeteer para Render

O build command é simples:
```
npm install && npm run build
```

A Render já tem suporte para Puppeteer. O código detecta automaticamente o Chrome do sistema e tenta múltiplos caminhos:
- `/usr/bin/chromium-browser`
- `/usr/bin/chromium`
- `/usr/bin/google-chrome`
- `/usr/bin/google-chrome-stable`
- `/snap/bin/chromium`

Se não encontrar nenhum, o Puppeteer baixa sua própria versão automaticamente.

### 3. Health Check

O servidor Express responde "OK" na rota `/`, o que satisfaz o requisito do Render de ter uma porta HTTP aberta. O Render fará health checks automáticos nesta rota.

## 🚢 Deploy no Railway

### 1. Criar Projeto

```bash
# Instalar CLI do Railway
npm install -g @railway/cli

# Login
railway login

# Inicializar no diretório background-server
cd background-server
railway init

# Configurar variáveis de ambiente
railway variables set SUPABASE_URL=your-supabase-url
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Deploy
railway up
```

### 2. Variáveis de Ambiente no Railway

No dashboard do Railway:
- Settings > Variables
- Adicione:
  - `SUPABASE_URL` = URL do seu projeto Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` = Service Role Key do Supabase
  - `PORT` = 3000 (ou qualquer porta disponível)

## 📊 Como Usar

### Criar um Job de Scraping

No seu frontend, insira um job na tabela `scraper_jobs`:

```typescript
const { data, error } = await supabase.from('scraper_jobs').insert({
  user_id: userId,
  query: 'restaurantes em São Paulo',
  limit: 50,
  only_cellphones: true,
  exclude_fixed_phones: true,
  only_with_instagram_or_whatsapp: false,
  status: 'pending',
});
```

### Monitorar Progresso

O frontend pode escutar mudanças em tempo real via Supabase:

```typescript
supabase
  .channel('scraper_jobs')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scraper_jobs' }, (payload) => {
    console.log('Status atualizado:', payload.new.status);
  })
  .subscribe();
```

### Ver Logs

```typescript
const { data: logs } = await supabase
  .from('scraper_logs')
  .select('*')
  .eq('job_id', jobId)
  .order('created_at', { ascending: true });
```

### Ver Resultados

```typescript
const { data: results } = await supabase
  .from('scraper_results')
  .select('*')
  .eq('job_id', jobId);
```

## 🔄 Fluxo de Trabalho

1. Frontend insere job com `status: 'pending'` em `scraper_jobs`
2. Background server detecta via Supabase Realtime
3. Server atualiza status para `processing`
4. Server executa scraping com Puppeteer (usando mapsScraperManager)
5. Server intercepta eventos do scraper e salva no Supabase:
   - `log` → `scraper_logs`
   - `item-scraped` → `scraper_results`
   - `status` → atualiza `scraper_jobs`
6. Server atualiza status para `completed` ou `failed`
7. Frontend recebe atualizações em tempo real via Supabase Realtime

## 🛡️ Segurança

- Use `SERVICE_ROLE_KEY` apenas no servidor de background
- Nunca exponha `SERVICE_ROLE_KEY` no frontend
- Use `ANON_KEY` no frontend com RLS habilitado
- As tabelas têm Row Level Security configurado

## 📝 Estrutura do Projeto

```
background-server/
├── src/
│   ├── index.ts          # Arquivo principal com Express e Supabase
│   └── services/
│       └── maps-scraper.ts  # MapsScraperService e MapsScraperManager
├── dist/                 # Código compilado
├── package.json
├── tsconfig.json
├── .env.example
├── railway.json          # Config Railway
├── render.yaml           # Config Render
└── README.md
```

## 🐛 Troubleshooting

### Jobs não são processados
- Verifique se Realtime está habilitado no Supabase
- Verifique as variáveis de ambiente
- Verifique os logs do servidor

### Erro de permissão no Supabase
- Certifique-se de usar `SERVICE_ROLE_KEY`
- Verifique as policies RLS nas tabelas

### Puppeteer falha no deploy
- A Render já tem suporte para Puppeteer
- O código detecta automaticamente o Chrome do sistema
- Tenta múltiplos caminhos possíveis do Chrome/Chromium
- Se não encontrar, o Puppeteer baixa sua própria versão
- Verifique os logs para ver qual caminho foi usado

### Health check falha no Render
- Verifique se a porta está configurada corretamente (PORT=10000)
- Verifique os logs do Render para ver se o servidor iniciou

### Erros de TypeScript no IDE
- O build funciona mesmo com erros no IDE (falsos positivos)
- Execute `npm run build` para verificar se compila corretamente
