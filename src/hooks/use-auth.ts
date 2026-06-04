'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Helper function to fetch profile status with a timeout to prevent hanging on database issues or recursive RLS policies
async function fetchProfileStatusWithTimeout(userId: string, timeoutMs: number = 4000): Promise<string | null> {
  if (!supabase) return null;

  const timeoutPromise = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
  );

  const queryPromise = (async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[use-auth] Error fetching profile:', error);
      return null;
    }
    return data?.status ?? null;
  })();

  try {
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (err) {
    console.error('[use-auth] Profile status fetch failed or timed out:', err);
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      // Check if user is approved
      if (data.session?.user) {
        const status = await fetchProfileStatusWithTimeout(data.session.user.id);
        setIsApproved(status === 'active');
      } else {
        setIsApproved(false);
      }
    } catch (err) {
      console.error('[use-auth] Error in refresh:', err);
      setIsApproved(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      try {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Check if user is approved
        if (newSession?.user) {
          const status = await fetchProfileStatusWithTimeout(newSession.user.id);
          setIsApproved(status === 'active');
        } else {
          setIsApproved(false);
        }
      } catch (err) {
        console.error('[use-auth] Error in onAuthStateChange:', err);
        setIsApproved(false);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [refresh]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsApproved(false);
  }, []);

  return { user, session, loading, signOut, refresh, isConfigured: !!supabase, isApproved };
}

