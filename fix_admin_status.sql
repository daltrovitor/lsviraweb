-- Script para atualizar o status do admin para 'active'
-- Execute isso no SQL Editor do Supabase

UPDATE public.profiles
SET status = 'active'
WHERE role = 'admin';

-- Se você sabe o email do seu admin, pode usar:
-- UPDATE public.profiles
-- SET status = 'active'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'seu-email@aqui.com');
