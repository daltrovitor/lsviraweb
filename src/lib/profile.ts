import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type UserProfile = {
  id: string;
  full_name: string | null;
  company?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  email?: string | null;
};

const PROFILE_COLUMNS = 'id, full_name, company, role, status, created_at, last_access';

function profileFromUser(user: User): UserProfile {
  return {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Usuário',
    email: user.email ?? undefined,
    role: 'user',
    status: 'pending',
  };
}

/** Fetches the user profile without throwing 406 when the row is missing. */
export async function fetchUserProfile(user: User): Promise<UserProfile> {
  if (!supabase) return profileFromUser(user);

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[profiles] fetch failed:', error.message);
    return profileFromUser(user);
  }

  if (data) {
    return { ...data, email: user.email ?? undefined };
  }

  // Row missing (e.g. user created before trigger) — create if policy allows
  const insertPayload = {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Usuário',
    role: 'user',
    status: 'pending',
  };

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert(insertPayload)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (!insertError && created) {
    return { ...created, email: user.email ?? undefined };
  }

  return profileFromUser(user);
}
