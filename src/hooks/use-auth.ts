'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createBrowserClient } from '@/lib/supabase/client'
import { mapSupabaseError } from '@/lib/api/errors'
import type { User, Artist } from '@/types/models'
import type { ApiResult } from '@/types/api'

export function useAuth(): {
  user: User | null
  artist: Artist | null
  isStaff: boolean
  isAdmin: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<ApiResult<void>>
  logout(): Promise<void>
} {
  const { user, artist, isStaff, isAdmin, isLoading, setUser, setArtist, setLoading, reset } =
    useAuthStore()

  const supabaseRef = useRef(createBrowserClient())

  useEffect(() => {
    const supabase = supabaseRef.current

    async function loadSession() {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session

      if (!session) {
        setLoading(false)
        return
      }

      const userId = session.user.id

      const { data: userData, error: userError } = await supabase
        .schema('public')
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !userData) {
        setLoading(false)
        return
      }

      const typedUser = userData as User
      setUser(typedUser)

      if (typedUser.role === 'artist') {
        const { data: artistData } = await supabase
          .schema('public')
          .from('artists')
          .select(
            'id, user_id, name, color, instagram_handle, tiktok_handle, youtube_handle, spotify_handle, is_active, deactivated_at, created_at, updated_at'
          )
          .eq('user_id', userId)
          .single()

        if (artistData) {
          setArtist(artistData as Artist)
        }
      }

      setLoading(false)
    }

    loadSession()
  }, [setUser, setArtist, setLoading])

  useEffect(() => {
    const supabase = supabaseRef.current

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session
        if (!session) return

        const userId = session.user.id

        const { data: userData } = await supabase
          .schema('public')
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (!userData) return

        const typedUser = userData as User
        setUser(typedUser)

        if (typedUser.role === 'artist') {
          const { data: artistData } = await supabase
            .schema('public')
            .from('artists')
            .select(
              'id, user_id, name, color, instagram_handle, tiktok_handle, youtube_handle, spotify_handle, is_active, deactivated_at, created_at, updated_at'
            )
            .eq('user_id', userId)
            .single()

          if (artistData) {
            setArtist(artistData as Artist)
          }
        }
      } else if (event === 'SIGNED_OUT') {
        reset()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setArtist, reset])

  async function login(email: string, password: string): Promise<ApiResult<void>> {
    const supabase = supabaseRef.current
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { ok: false, error: mapSupabaseError(error) }
    }
    return { ok: true, data: undefined }
  }

  async function logout(): Promise<void> {
    const supabase = supabaseRef.current
    await supabase.auth.signOut()
  }

  return { user, artist, isStaff, isAdmin, isLoading, login, logout }
}
