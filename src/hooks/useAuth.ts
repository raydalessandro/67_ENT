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
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      setUser(null);
      return;
    }

    setUser(profile);

    // If artist role, load artist profile
    if (profile.role === 'artist') {
      const { data: artistProfile } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (artistProfile) setArtist(artistProfile);
    }
  }, [setUser, setArtist]);

  // Init: check existing session + listen for changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
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
