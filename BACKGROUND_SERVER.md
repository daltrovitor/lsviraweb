# Background Server - Guia de Deploy

Este servidor de background processa tarefas de Web Scraping e WhatsApp 24/7 separado do frontend.

## 📁 Estrutura

```
background-server/
├── src/
│   └── index.ts          # Servidor principal
├── package.json
├── tsconfig.json
├── .env.example
├── railway.json          # Configuração Railway
├── render.yaml           # Configuração Render
└── README.md
```

## 🚀 Deploy no Railway

### 1. Preparar o Repositório

O servidor de background está na pasta `background-server/`. Para deploy no Railway, você tem duas opções:

#### Opção A: Repositório Separado (Recomendado)

1. Crie um repositório separado apenas para o `background-server`
2. Mova a pasta `background-server` para esse repositório
3. Siga os passos abaixo

#### Opção B: Subdiretório

1. Configure o Railway para usar o subdiretório:
   - No Railway, vá em Settings > General
   - Em "Root Directory", coloque: `background-server`

### 2. Criar Projeto no Railway

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

### 3. Variáveis de Ambiente no Railway

No dashboard do Railway:
- Settings > Variables
- Adicione:
  - `SUPABASE_URL` = URL do seu projeto Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` = Service Role Key do Supabase (não ANON_KEY)

### 4. Configurar o Build

No Railway, o build deve ser configurado automaticamente pelo `railway.json`. Se precisar ajustar:
- Settings > Build
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

## 🚀 Deploy no Render

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

### 3. Configurar o render.yaml

O arquivo `render.yaml` já está configurado. Se preferir configurar via dashboard, use as mesmas configurações do YAML.

## 🔧 Configurar Supabase

### 1. Habilitar Realtime

No Supabase Dashboard:
1. Vá em Database > Replication
2. Adicione `scraper_jobs` à publicação `supabase_realtime`
3. Ou execute o SQL do `supabase_schema.sql` que já inclui isso

### 2. Executar Schema SQL

Execute o SQL atualizado no seu Supabase:
```bash
# No Supabase Dashboard > SQL Editor
# Execute o conteúdo de supabase_schema.sql
```

Isso criará as tabelas:
- `scraper_jobs` - Jobs de scraping
- `scraper_logs` - Logs do processo
- `scraper_results` - Resultados extraídos

## 🧪 Testar Localmente

```bash
cd background-server

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Edite .env com suas credenciais

# Executar em desenvolvimento
npm run dev

# Ou compilar e executar
npm run build
npm start
```

## 📊 Monitoramento

### Verificar se o servidor está rodando

No Railway/Render, verifique os logs:
- Deve mostrar: `[SERVER] Background Server rodando e aguardando jobs...`
- Deve mostrar: `[REALTIME] Status do subscription: subscribed`

### Testar criando um job manualmente

No Supabase SQL Editor:
```sql
INSERT INTO public.scraper_jobs (
  user_id,
  query,
  limit,
  only_cellphones,
  exclude_fixed_phones,
  only_with_instagram_or_whatsapp,
  status
) VALUES (
  'test-user-id',
  'restaurantes em São Paulo',
  10,
  true,
  false,
  false,
  'pending'
);
```

O servidor deve processar automaticamente e você deve ver logs no Railway/Render.

## 🔗 Conectar Frontend ao Background Server

O frontend não se conecta diretamente ao servidor de background. Ele usa o Supabase como intermediário:

1. Frontend insere job em `scraper_jobs` com status `pending`
2. Background server detecta via Realtime
3. Background server processa e salva resultados
4. Frontend escuta mudanças via Realtime

### Exemplo no Frontend

```typescript
// Criar job
const { data } = await supabase.from('scraper_jobs').insert({
  user_id: userId,
  query: 'restaurantes em São Paulo',
  limit: 50,
  status: 'pending',
});

// Escutar progresso
supabase
  .channel('job-progress')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'scraper_jobs',
    filter: `id=eq.${data[0].id}`
  }, (payload) => {
    console.log('Status:', payload.new.status);
    console.log('Progresso:', payload.new.current_count);
  })
  .subscribe();

// Ver resultados
const { data: results } = await supabase
  .from('scraper_results')
  .select('*')
  .eq('job_id', data[0].id);
```

## ⚠️ Importante

- **SERVICE_ROLE_KEY**: Use apenas no servidor de background, nunca no frontend
- **ANON_KEY**: Use no frontend com RLS habilitado
- **Segurança**: O servidor de background tem acesso total ao banco, proteja suas credenciais
- **Custos**: Puppeteer consome recursos, monitore o uso no Railway/Render

## 🐛 Troubleshooting

### Jobs não são processados
- Verifique se Realtime está habilitado no Supabase
- Verifique as variáveis de ambiente
- Verifique os logs do servidor

### Erro "column does not exist"
- Execute o SQL do `supabase_schema.sql` completo
- Verifique se todas as tabelas foram criadas

### Puppeteer falha no deploy
- No Railway, pode ser necessário adicionar flags no package.json
- No Render, o ambiente já suporta Puppeteer

### Conexão Realtime falha
- Verifique se a tabela `scraper_jobs` está na publicação `supabase_realtime`
- Verifique as RLS policies (o servidor usa SERVICE_ROLE_KEY, então ignora RLS)
