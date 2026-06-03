'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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
      
      console.log('[use-auth] refresh - session:', !!data.session, 'user:', !!data.session?.user);
      
      // Check if user is approved
      if (data.session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.session.user.id)
          .maybeSingle();
        
        console.log('[use-auth] refresh - profile:', profile, 'error:', error);
        setIsApproved(profile?.status === 'active');
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
      console.log('[use-auth] onAuthStateChange - event:', _event, 'session:', !!newSession);
      try {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Check if user is approved
        if (newSession?.user && supabase) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', newSession.user.id)
            .maybeSingle();
          
          console.log('[use-auth] onAuthStateChange - profile:', profile, 'error:', error);
          setIsApproved(profile?.status === 'active');
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
