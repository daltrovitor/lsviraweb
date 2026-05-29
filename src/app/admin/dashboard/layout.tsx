import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!supabase) {
    console.error('Supabase not configured');
    redirect('/admin/login');
  }

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('No session found');
    redirect('/admin/login');
  }

  console.log('Session found for user:', session.user.id);

  // Check user role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  console.log('Profile data:', profile, 'Error:', error);

  if (!profile || profile.role !== 'admin') {
    console.error('User is not admin or profile not found');
    await supabase.auth.signOut();
    redirect('/admin/login');
  }

  return <>{children}</>;
}
