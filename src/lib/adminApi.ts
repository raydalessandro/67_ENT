// ============================================================================
// Admin API — calls admin-artists Edge Function
// ============================================================================

import { supabase } from '@/lib/supabase';
import { AppError, mapSupabaseError } from '@/lib/errors';
import type { ApiResult } from '@/types/api';

const FUNCTION_NAME = 'admin-artists';

async function callAdminFunction<T>(body: Record<string, any>): Promise<ApiResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body,
    });

    if (error) {
      return { ok: false, error: mapSupabaseError(error) };
    }

    if (data?.error) {
      return {
        ok: false,
        error: new AppError('INTERNAL_ERROR', data.error),
      };
    }

    return { ok: true, data: data as T };
  } catch (err) {
    return {
      ok: false,
      error: new AppError('NETWORK_ERROR', 'Errore di rete'),
    };
  }
}

export interface ArtistListItem {
  id: string;
  name: string;
  color: string;
  bio: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  spotify_url: string | null;
  is_active: boolean;
  ai_enabled: boolean;
  created_at: string;
  user_id: string;
  users: {
    email: string;
    display_name: string;
  };
}

export interface CreateArtistInput {
  email: string;
  password: string;
  display_name: string;
  artist_name: string;
  color: string;
  bio?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_handle?: string;
  spotify_url?: string;
}

export interface CreateArtistResult {
  success: boolean;
  user_id: string;
  artist_id: string;
  credentials: { email: string; password: string };
  message: string;
}

export const adminApi = {
  listArtists: () =>
    callAdminFunction<{ artists: ArtistListItem[] }>({ action: 'list' }),

  createArtist: (input: CreateArtistInput) =>
    callAdminFunction<CreateArtistResult>({ action: 'create', ...input }),

  updateArtist: (artist_id: string, updates: Partial<CreateArtistInput> & { is_active?: boolean }) =>
    callAdminFunction<{ success: boolean }>({ action: 'update', artist_id, ...updates }),

  resetPassword: (user_id: string, new_password: string) =>
    callAdminFunction<{ success: boolean }>({ action: 'reset_password', user_id, new_password }),

  deleteArtist: (artist_id: string, user_id: string) =>
    callAdminFunction<{ success: boolean }>({ action: 'delete', artist_id, user_id }),

  toggleAI: (artist_id: string, enabled: boolean) =>
    callAdminFunction<{ success: boolean }>({ action: 'toggle_ai', artist_id, enabled }),
};
