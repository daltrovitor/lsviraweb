-- Verificar o status do usuário isadmin@viraweb.online
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.status,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'isadmin@viraweb.online';

-- Verificar todos os usuários admin
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.status,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
