import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!supabase) {
    redirect('/admin/login');
  }

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/admin/login');
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    await supabase.auth.signOut();
    redirect('/admin/login');
  }

  return <>{children}</>;
}
