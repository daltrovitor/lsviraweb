-- Diagnosticar problema de login do admin
-- Este script verifica se o usuário admin tem o profile correto

-- 1. Verificar se o usuário existe no auth.users
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
WHERE u.email = 'isadmin@viraweb.online';

-- 2. Verificar se o profile existe na tabela profiles
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.status,
  p.created_at,
  p.last_access
FROM public.profiles p
WHERE p.id IN (
  SELECT u.id FROM auth.users u WHERE u.email = 'isadmin@viraweb.online'
);

-- 3. Verificar todos os usuários com role admin
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.status,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.role = 'admin' OR p.role IS NULL;

-- 4. Se o profile não existir ou estiver incorreto, usar este comando para corrigir:
-- UPDATE public.profiles 
-- SET role = 'admin', status = 'active' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'isadmin@viraweb.online');

-- 5. Se o profile não existir, criar:
-- INSERT INTO public.profiles (id, full_name, role, status)
-- SELECT 
--   u.id,
--   u.raw_user_meta_data->>'full_name',
--   'admin',
--   'active'
-- FROM auth.users u
-- WHERE u.email = 'isadmin@viraweb.online'
-- AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
