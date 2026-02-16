// ============================================================================
// useAuth — Auth state + actions
// ============================================================================

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/errors';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResult } from '@/types/api';
import type { User } from '@/types/models';

export function useAuth() {
  const { user, artist, isStaff, isLoading, setUser, setArtist, logout: clearStore } = useAuthStore();

  const loadUserProfile = useCallback(async (userId: string) => {
    console.log('[useAuth] Loading profile for user:', userId);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      );

      const queryPromise = supabase
        .schema('public')
        .from('users')
        .select('id, email, display_name, role, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

        console.log('[useAuth] User profile result:', { profile, error });

      if (error || !profile) {
        console.log('[useAuth] Setting user to null due to error');
        setUser(null);
        return;
      }

      console.log('[useAuth] Setting user:', profile);
      setUser(profile);

      // If artist role, load artist profile
      if (profile.role === 'artist') {
        console.log('[useAuth] Loading artist profile...');
        const { data: artistProfile, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .eq('user_id', userId)
          .single();

        console.log('[useAuth] Artist profile result:', { artistProfile, artistError });

        if (artistProfile) setArtist(artistProfile);
      }
    } catch (err) {
      console.error('[useAuth] Exception during profile load:', err);
      setUser(null);
    }
  }, [setUser, setArtist]);

  // Init: check existing session + listen for changes
  useEffect(() => {
    let mounted = true;

    console.log('[useAuth] Initializing auth...');

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      console.log('[useAuth] Session:', session?.user ? 'logged in' : 'logged out');
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        console.log('[useAuth] No session, setting user to null');
        setUser(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          clearStore();
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile, setUser, clearStore]);

  const login = async (email: string, password: string): Promise<ApiResult<User>> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: mapSupabaseError(error) };

    // Profile gets loaded via onAuthStateChange, wait briefly
    await new Promise(resolve => setTimeout(resolve, 100));
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { ok: false, error: mapSupabaseError({ message: 'Profile not found', status: 404 }) };
    }
    return { ok: true, data: currentUser };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearStore();
  };

  return { user, artist, isStaff, isLoading, login, signOut };
}
