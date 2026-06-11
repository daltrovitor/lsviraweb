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

const PROFILE_COLUMNS = 'id, full_name, company, role, status, created_at';

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

<<<<<<< HEAD
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
=======
  const timeoutPromise = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)
  );

  const queryPromise = (async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[profiles] fetch failed:', error.message);
      return null;
    }
    return data;
  })();

  let data = null;
  try {
    data = await Promise.race([queryPromise, timeoutPromise]);
  } catch (err) {
    console.error('[profiles] fetch timed out or failed:', err);
  }

  if (data) {
    return { ...data, email: user.email ?? undefined } as UserProfile;
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
  }

  // Row missing (e.g. user created before trigger) — create if policy allows
  const insertPayload = {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Usuário',
    role: 'user',
    status: 'pending',
  };

<<<<<<< HEAD
  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert(insertPayload)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (!insertError && created) {
    return { ...created, email: user.email ?? undefined };
=======
  const insertQueryPromise = (async () => {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert(insertPayload)
      .select(PROFILE_COLUMNS)
      .maybeSingle();

    if (insertError) {
      console.warn('[profiles] insert failed:', insertError.message);
      return null;
    }
    return created;
  })();

  let created = null;
  try {
    created = await Promise.race([insertQueryPromise, timeoutPromise]);
  } catch (err) {
    console.error('[profiles] insert timed out or failed:', err);
  }

  if (created) {
    return { ...created, email: user.email ?? undefined } as UserProfile;
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
  }

  return profileFromUser(user);
}
