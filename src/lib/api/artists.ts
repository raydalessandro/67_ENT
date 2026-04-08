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
    supabase.from('artists').select(ARTIST_COLUMNS).order('name') as any
  )
  if (!result.ok) return result
  return { ok: true, data: result.data ?? [] }
}

export async function createArtist(input: CreateArtistInput): Promise<ApiResult<Artist & { password?: string }>> {
  try {
    const res = await fetch('/api/artists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = await res.json()
    if (!res.ok) {
      const { createError } = await import('@/lib/api/errors')
      return { ok: false, error: createError('UNKNOWN', data.error || 'Errore creazione artista', data.error || 'Errore durante la creazione') }
    }
    return { ok: true, data: { ...data.artist, password: data.password } }
  } catch (err) {
    const { createError } = await import('@/lib/api/errors')
    return { ok: false, error: createError('NETWORK_ERROR', String(err), 'Errore di rete') }
  }
}

export async function updateArtist(
  id: string,
  input: UpdateArtistInput
): Promise<ApiResult<Artist>> {
  try {
    const res = await fetch(`/api/artists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = await res.json()
    if (!res.ok) {
      const { createError } = await import('@/lib/api/errors')
      return { ok: false, error: createError('UNKNOWN', data.error, data.error) }
    }
    return { ok: true, data: data.artist }
  } catch (err) {
    const { createError } = await import('@/lib/api/errors')
    return { ok: false, error: createError('NETWORK_ERROR', String(err), 'Errore di rete') }
  }
}

export async function deactivateArtist(id: string): Promise<ApiResult<void>> {
  return updateArtist(id, { is_active: false }).then(
    (r) => (r.ok ? { ok: true as const, data: undefined } : r)
  )
}

export async function resetPassword(
  artistId: string,
  newPassword: string
): Promise<ApiResult<void>> {
  try {
    const res = await fetch(`/api/artists/${artistId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    if (!res.ok) {
      const data = await res.json()
      const { createError } = await import('@/lib/api/errors')
      return { ok: false, error: createError('UNKNOWN', data.error, data.error) }
    }
    return { ok: true, data: undefined }
  } catch (err) {
    const { createError } = await import('@/lib/api/errors')
    return { ok: false, error: createError('NETWORK_ERROR', String(err), 'Errore di rete') }
  }
}
