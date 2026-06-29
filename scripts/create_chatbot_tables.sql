-- SQL Migration: Chatbot Híbrido Tables
-- Executar no Query Editor do Supabase

-- 1. Tabela de Roteiros e Passos do Bot (bot_steps)
CREATE TABLE IF NOT EXISTS public.bot_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE, -- NULL indica chatbot geral (institucional)
  step_key TEXT NOT NULL, -- ex: 'start', 'opcao_1', 'menu_principal'
  message_text TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb, -- ex: [{"trigger": "1", "next_step": "suporte"}, {"trigger": "preco", "next_step": "comercial"}]
  is_initial BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices e restrições únicas para bot_steps
CREATE UNIQUE INDEX IF NOT EXISTS bot_steps_user_campaign_step_idx 
  ON public.bot_steps (user_id, campaign_id, step_key) 
  WHERE campaign_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bot_steps_user_general_step_idx 
  ON public.bot_steps (user_id, step_key) 
  WHERE campaign_id IS NULL;

-- Habilitar RLS para bot_steps
ALTER TABLE public.bot_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bot steps" 
  ON public.bot_steps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. Tabela de Sessões e Status da Conversa (customer_chat_status)
CREATE TABLE IF NOT EXISTS public.customer_chat_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Dono do bot que está atendendo
  customer_phone TEXT NOT NULL, -- Número do cliente (sanitizado)
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL, -- Campanha ativa (se houver)
  current_step_key TEXT, -- Passo atual do fluxo
  status TEXT DEFAULT 'GERAL' CHECK (status IN ('CAMPANHA_PENDENTE', 'GERAL', 'HUMANO')),
  session_data JSONB DEFAULT '{}'::jsonb, -- Armazena dados extras (como e-mail digitado, etc.)
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, customer_phone)
);

CREATE INDEX IF NOT EXISTS customer_chat_status_user_phone_idx ON public.customer_chat_status(user_id, customer_phone);

-- Habilitar RLS para customer_chat_status
ALTER TABLE public.customer_chat_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own customer chat status" 
  ON public.customer_chat_status FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 3. Tabela de Histórico de Entregas de Disparos (campaign_deliveries)
CREATE TABLE IF NOT EXISTS public.campaign_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS campaign_deliveries_user_phone_idx ON public.campaign_deliveries(user_id, customer_phone);
CREATE INDEX IF NOT EXISTS campaign_deliveries_search_idx ON public.campaign_deliveries(user_id, campaign_id, customer_phone);

-- Habilitar RLS para campaign_deliveries
ALTER TABLE public.campaign_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own campaign deliveries" 
  ON public.campaign_deliveries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para bot_steps
DROP TRIGGER IF EXISTS on_bot_steps_updated ON public.bot_steps;
CREATE TRIGGER on_bot_steps_updated
  BEFORE UPDATE ON public.bot_steps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Aplicar trigger para customer_chat_status
DROP TRIGGER IF EXISTS on_customer_chat_status_updated ON public.customer_chat_status;
CREATE TRIGGER on_customer_chat_status_updated
  BEFORE UPDATE ON public.customer_chat_status
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar Realtime para as novas tabelas (opcional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_chat_status;
