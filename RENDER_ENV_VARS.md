# Variáveis de Ambiente para Render

## Variáveis Obrigatórias

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - URL do seu projeto Supabase (ex: https://xyz.supabase.co)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase (para frontend)
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key do Supabase (para backend/server)

### Node.js
- `NODE_ENV` - Deve ser `production`
- `PORT` - Render define automaticamente (geralmente 10000), mas pode definir manualmente
- `HOST` - Deve ser `0.0.0.0` (Render exige isso)

### Socket.io (para frontend conectar)
- `NEXT_PUBLIC_SOCKET_URL` - URL do servidor backend (ex: https://seu-app.onrender.com)

## Variáveis Opcionais

### WhatsApp Baileys
- `WA_RESTART_ALWAYS` - Se deve reiniciar WhatsApp sempre (true/false)
- `WA_LOG_LEVEL` - Nível de log (error, warn, info, debug)

## Configuração no Render

1. Vá em Settings > Environment Variables
2. Adicione as variáveis abaixo:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
HOST=0.0.0.0
NEXT_PUBLIC_SOCKET_URL=https://seu-app.onrender.com
```

## Notas Importantes

1. **SUPABASE_SERVICE_ROLE_KEY**: Esta chave tem acesso total ao banco. Nunca exponha no frontend.
2. **NEXT_PUBLIC_SOCKET_URL**: Deve ser a URL completa do seu app no Render (com https://).
3. **HOST=0.0.0.0**: Obrigatório para Render passar no health check.
4. **PORT**: Render define automaticamente, mas você pode fixar se necessário.

## Como Obter as Chaves do Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Vá no seu projeto > Settings > API
3. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## Health Check

O servidor responde em qualquer rota graças ao Next.js. O Render fará health check automático na URL principal.
