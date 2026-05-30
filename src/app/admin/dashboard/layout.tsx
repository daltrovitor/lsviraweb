import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase not configured');
    redirect('/admin/login');
  }

  // Create server client that can read cookies
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('No session found');
    redirect('/admin/login');
  }

  console.log('Session found for user:', session.user.id);

  // Check user role and status
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', session.user.id)
    .single();

  console.log('Profile data:', profile, 'Error:', error);

  // If profile doesn't exist, redirect to login (don't auto-create admin profile)
  if (error || !profile) {
    console.error('Profile not found for user:', session.user.id);
    redirect('/admin/login');
  }
  
  // Check if user is admin and active
  if (profile.role !== 'admin' || profile.status !== 'active') {
    console.error('User is not admin or not active:', profile.role, profile.status);
    redirect('/admin/login');
  }

  return <>{children}</>;
}
