import type { Artist } from '@/types/models'
import type { ApiResult } from '@/types/api'
import { query } from '@/lib/api/errors'
import { createBrowserClient } from '@/lib/supabase/client'

export interface CreateArtistInput {
  name: string
  email: string
  password?: string
  color?: string
  instagram_handle?: string
  tiktok_handle?: string
  youtube_handle?: string
  spotify_handle?: string
  instagram_token?: string
}

export interface UpdateArtistInput {
  name?: string
  color?: string
  instagram_handle?: string
  tiktok_handle?: string
  youtube_handle?: string
  spotify_handle?: string
  instagram_token?: string
  is_active?: boolean
}

const ARTIST_COLUMNS = [
  'id',
  'user_id',
  'name',
  'color',
  'instagram_handle',
  'tiktok_handle',
  'youtube_handle',
  'spotify_handle',
  'is_active',
  'deactivated_at',
  'created_at',
  'updated_at',
].join(', ')

function generatePassword(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase()
}

export async function getArtists(): Promise<ApiResult<Artist[]>> {
  const supabase = createBrowserClient()
  const result = await query<Artist[]>(
    supabase.from('artists').select(ARTIST_COLUMNS).order('name')
  )
  if (!result.ok) return result
  return { ok: true, data: result.data ?? [] }
}

export async function createArtist(input: CreateArtistInput): Promise<ApiResult<Artist>> {
  const supabase = createBrowserClient()
  const password = input.password ?? generatePassword()
  const payload = {
    name: input.name,
    email: input.email,
    password,
    color: input.color,
    instagram_handle: input.instagram_handle,
    tiktok_handle: input.tiktok_handle,
    youtube_handle: input.youtube_handle,
    spotify_handle: input.spotify_handle,
    instagram_token: input.instagram_token,
  }
  return query<Artist>(supabase.rpc('create_artist_atomic', payload))
}

export async function updateArtist(
  id: string,
  input: UpdateArtistInput
): Promise<ApiResult<Artist>> {
  const supabase = createBrowserClient()
  return query<Artist>(
    supabase.from('artists').update(input).eq('id', id).select(ARTIST_COLUMNS).single()
  )
}

export async function deactivateArtist(id: string): Promise<ApiResult<void>> {
  const supabase = createBrowserClient()
  const { error } = await supabase.rpc('deactivate_artist', { artist_id: id })
  if (error) {
    const { mapSupabaseError } = await import('@/lib/api/errors')
    return { ok: false, error: mapSupabaseError(error) }
  }
  return { ok: true, data: undefined }
}

export async function resetPassword(
  userId: string,
  newPassword: string
): Promise<ApiResult<void>> {
  const supabase = createBrowserClient()
  const { error } = await supabase.rpc('reset_user_password', {
    target_user_id: userId,
    new_password: newPassword,
  })
  if (error) {
    const { mapSupabaseError } = await import('@/lib/api/errors')
    return { ok: false, error: mapSupabaseError(error) }
  }
  return { ok: true, data: undefined }
}
