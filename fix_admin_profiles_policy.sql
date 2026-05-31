-- Adicionar política RLS para permitir que admins vejam todos os profiles
-- Isso resolve o problema de só aparecer 1 usuário no dashboard admin

-- Política para admins verem todos os profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Política para admins atualizarem qualquer profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
