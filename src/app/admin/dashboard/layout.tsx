import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily disable authentication check to prevent redirect loop
  // TODO: Re-enable authentication check after fixing the loop issue
  
  // if (!supabase) {
  //   console.error('Supabase not configured');
  //   redirect('/admin/login');
  // }

  // // Check authentication
  // const { data: { session } } = await supabase.auth.getSession();
  
  // if (!session) {
  //   console.error('No session found');
  //   redirect('/admin/login');
  // }

  // console.log('Session found for user:', session.user.id);

  // // Check user role - temporarily allow access for debugging
  // const { data: profile, error } = await supabase
  //   .from('profiles')
  //   .select('role, status')
  //   .eq('id', session.user.id)
  //   .single();

  // console.log('Profile data:', profile, 'Error:', error);

  // // If profile doesn't exist, create it with admin role
  // if (error || !profile) {
  //   console.log('Profile not found, creating admin profile for user:', session.user.id);
  //   const { error: insertError } = await supabase
  //     .from('profiles')
  //     .insert({
  //       id: session.user.id,
  //       full_name: session.user.user_metadata?.full_name || 'Admin',
  //       role: 'admin',
  //       status: 'active'
  //     });
    
  //   if (insertError) {
  //     console.error('Error creating profile:', insertError);
  //     // Still allow access for first-time setup
  //   }
  // } else if (profile.role !== 'admin') {
  //   console.error('User is not admin:', profile.role);
  //   redirect('/admin/login');
  // }

  return <>{children}</>;
}
