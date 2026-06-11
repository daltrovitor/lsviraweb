-- Habilitar a extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. Tabela de Perfis de Usuários (profiles)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_access TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. Tabela de Buscas no Maps (maps_searches)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.maps_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  target_limit INTEGER DEFAULT 0,
  leads_found INTEGER DEFAULT 0,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.maps_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own maps searches" 
  ON public.maps_searches FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own maps searches" 
  ON public.maps_searches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own maps searches" 
  ON public.maps_searches FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own maps searches" 
  ON public.maps_searches FOR DELETE 
  USING (auth.uid() = user_id);

-- ==========================================
-- 3. Tabela de Leads Extraídos (scraped_leads)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scraped_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_id UUID NOT NULL REFERENCES public.maps_searches(id) ON DELETE CASCADE,
  title TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating TEXT,
  category TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.scraped_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scraped leads" 
  ON public.scraped_leads FOR SELECT 
  USING (
    search_id IN (
      SELECT id FROM public.maps_searches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scraped leads" 
  ON public.scraped_leads FOR INSERT 
  WITH CHECK (
    search_id IN (
      SELECT id FROM public.maps_searches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own scraped leads" 
  ON public.scraped_leads FOR UPDATE 
  USING (
    search_id IN (
      SELECT id FROM public.maps_searches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own scraped leads" 
  ON public.scraped_leads FOR DELETE 
  USING (
    search_id IN (
      SELECT id FROM public.maps_searches WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- 4. Tabela de Campanhas de Disparo (campaigns)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  delay_min INTEGER DEFAULT 5,
  delay_max INTEGER DEFAULT 15,
  status TEXT DEFAULT 'idle',
  stats JSONB DEFAULT '{"sent": 0, "error": 0, "total": 0, "pending": 0}'::jsonb,
  automation JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_count INTEGER GENERATED ALWAYS AS ((stats->>'sent')::integer) STORED,
  error_count INTEGER GENERATED ALWAYS AS ((stats->>'error')::integer) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns" 
  ON public.campaigns FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" 
  ON public.campaigns FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" 
  ON public.campaigns FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" 
  ON public.campaigns FOR DELETE 
  USING (auth.uid() = user_id);

-- ==========================================
-- 5. Tabela de Leads da Landing Page (landing_leads)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.landing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  password TEXT, -- Password to be set by admin when approving member
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

-- Admin can view all leads
CREATE POLICY "Admins can view all leads" 
  ON public.landing_leads FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can insert leads
CREATE POLICY "Admins can insert leads" 
  ON public.landing_leads FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can update leads
CREATE POLICY "Admins can update leads" 
  ON public.landing_leads FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can delete leads
CREATE POLICY "Admins can delete leads" 
  ON public.landing_leads FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Public can insert leads (for landing page form)
CREATE POLICY "Public can insert leads" 
  ON public.landing_leads FOR INSERT 
  WITH CHECK (true);

-- ==========================================
-- 6. Tabela de Jobs de Scraping (scraper_jobs) - Para Background Server
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scraper_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  "limit" INTEGER DEFAULT 30,
  only_cellphones BOOLEAN DEFAULT false,
  exclude_fixed_phones BOOLEAN DEFAULT false,
  only_with_instagram_or_whatsapp BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'stopped')),
  current_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.scraper_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scraper jobs" 
  ON public.scraper_jobs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scraper jobs" 
  ON public.scraper_jobs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraper jobs" 
  ON public.scraper_jobs FOR UPDATE 
  USING (auth.uid() = user_id);

-- ==========================================
-- 7. Tabela de Logs de Scraping (scraper_logs) - Para Background Server
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.scraper_jobs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  level TEXT DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scraper logs" 
  ON public.scraper_logs FOR SELECT 
  USING (
    job_id IN (
      SELECT id FROM public.scraper_jobs WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- 8. Tabela de Resultados de Scraping (scraper_results) - Para Background Server
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scraper_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.scraper_jobs(id) ON DELETE CASCADE,
  title TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating TEXT,
  category TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.scraper_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scraper results" 
  ON public.scraper_results FOR SELECT 
  USING (
    job_id IN (
      SELECT id FROM public.scraper_jobs WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- Trigger para criar o perfil automaticamente quando um usuário se cadastrar na Auth do Supabase
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user', 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deletar a trigger antiga se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar a trigger na auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- Function para habilitar realtime nas tabelas de jobs
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Habilitar realtime para scraper_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.scraper_jobs;
