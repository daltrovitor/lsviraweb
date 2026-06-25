-- =========================================================================
-- SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS (SUPABASE)
-- Execute este script no SQL Editor do Supabase para aplicar as alterações.
-- =========================================================================

-- 1. Atualizações na tabela de Campanhas (campaigns)
-- Adiciona a coluna 'name' se não existir
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS name TEXT;

-- Adiciona a coluna 'contacts' se não existir
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS contacts JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Adiciona a coluna 'automation' se não existir
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS automation JSONB DEFAULT '{}'::jsonb;

-- Adiciona a coluna 'stats' se não existir
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"sent": 0, "error": 0, "total": 0, "pending": 0}'::jsonb;

-- 2. Criação da tabela de Templates de Mensagem (message_templates)
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) para message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem para evitar conflitos de recriação
DROP POLICY IF EXISTS "Users can manage own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can view own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.message_templates;

-- Criar a nova política de controle completo para o usuário proprietário
CREATE POLICY "Users can manage own templates" 
  ON public.message_templates FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Recarregar o cache do PostgREST para reconhecer as alterações imediatamente
NOTIFY pgrst, 'reload schema';
