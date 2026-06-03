-- ==========================================
-- Admin Setup Script for LeadScrap
-- ==========================================

-- Update the landing_leads table to include password field
ALTER TABLE public.landing_leads 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Create an admin user (you need to run this in Supabase SQL editor)
-- First, create the auth user (you'll need to do this manually in Supabase dashboard)
-- Then update the profile to admin role

-- Example: After creating a user in Supabase Auth, run:
-- UPDATE public.profiles 
-- SET role = 'admin', status = 'active' 
-- WHERE id = 'YOUR_USER_ID_FROM_AUTH';

-- Or insert a new profile with admin role for an existing auth user:
-- INSERT INTO public.profiles (id, full_name, role, status)
-- VALUES ('YOUR_USER_ID_FROM_AUTH', 'Admin User', 'admin', 'active')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';

-- Grant additional permissions for admin to view all user data
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can view all campaigns
CREATE POLICY "Admins can view all campaigns" 
  ON public.campaigns FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can view all map searches
CREATE POLICY "Admins can view all map searches" 
  ON public.map_searches FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can view all scraped leads
CREATE POLICY "Admins can view all scraped leads" 
  ON public.scraped_leads FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
