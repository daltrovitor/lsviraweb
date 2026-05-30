-- Script para atualizar o status do admin para 'active'
-- Execute isso no SQL Editor do Supabase

-- 1. Remover a constraint antiga que não permite 'active'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- 2. Adicionar a constraint correta que permite 'pending', 'active', 'inactive'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('pending', 'active', 'inactive'));

-- 3. Atualizar o status do admin para 'active'
UPDATE public.profiles
SET status = 'active'
WHERE role = 'admin';

-- Se você sabe o email do seu admin, pode usar:
-- UPDATE public.profiles
-- SET status = 'active'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'seu-email@aqui.com');
