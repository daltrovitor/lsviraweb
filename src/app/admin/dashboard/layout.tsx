import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[AdminDashboardLayout] Starting layout check');
  
  const cookieStore = cookies();
  console.log('[AdminDashboardLayout] Cookies retrieved');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[AdminDashboardLayout] Supabase URL:', !!supabaseUrl, 'Anon Key:', !!supabaseAnonKey);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[AdminDashboardLayout] Supabase not configured');
    redirect('/admin/login');
  }

  // Create server client that can read cookies
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name);
        console.log(`[AdminDashboardLayout] Getting cookie ${name}:`, !!cookie);
        return cookie?.value;
      },
    },
  });

  console.log('[AdminDashboardLayout] Server client created');

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('[AdminDashboardLayout] Session check:', !!session, 'User ID:', session?.user?.id);
  
  if (!session) {
    console.error('[AdminDashboardLayout] No session found, redirecting to login');
    redirect('/admin/login');
  }

  console.log('[AdminDashboardLayout] Session found for user:', session.user.id);

  // Check user role and status
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', session.user.id)
    .single();

  console.log('[AdminDashboardLayout] Profile check - Profile:', profile, 'Error:', error);

  // If profile doesn't exist, redirect to login (don't auto-create admin profile)
  if (error || !profile) {
    console.error('[AdminDashboardLayout] Profile not found for user:', session.user.id, 'Error:', error);
    redirect('/admin/login');
  }
  
  // Check if user is admin and active
  if (profile.role !== 'admin' || profile.status !== 'active') {
    console.error('[AdminDashboardLayout] User is not admin or not active:', profile.role, profile.status);
    redirect('/admin/login');
  }

  console.log('[AdminDashboardLayout] All checks passed, rendering children');
  return <>{children}</>;
}
