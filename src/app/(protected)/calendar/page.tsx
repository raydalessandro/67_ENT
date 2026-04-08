'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePosts } from '@/hooks/use-posts'
import { useAuth } from '@/hooks/use-auth'
import { CalendarView } from '@/components/calendar/calendar-view'
import { PLATFORMS, POST_STATUSES } from '@/lib/constants'
import type { PostStatus, PostPlatform } from '@/types/models'

export default function CalendarPage() {
  const router = useRouter()
  const { artist, isStaff } = useAuth()

  const [artistFilter, setArtistFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>('')
  const [platformFilter, setPlatformFilter] = useState<PostPlatform | ''>('')

  const filters = useMemo(
    () => ({
      artist_id: artist?.id || artistFilter || undefined,
      status: (statusFilter || undefined) as PostStatus | undefined,
      platform: (platformFilter || undefined) as PostPlatform | undefined,
    }),
    [artist?.id, artistFilter, statusFilter, platformFilter]
  )

  const { posts, isLoading, error } = usePosts(filters)

  // Extract unique artists for filter (staff only)
  const artistOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const post of posts) {
      if (!seen.has(post.artist_id)) seen.set(post.artist_id, post.artist_name)
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [posts])

  function handleEventClick(postId: string) {
    router.push(`/posts/${postId}`)
  }

  function handleDateClick(date: string) {
    router.push(`/posts/new?date=${date}`)
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Calendario Post</h1>
          {isStaff && (
            <Link
              href="/posts/new"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5C518] text-black shadow-lg hover:bg-[#F5C518]/90 transition-colors"
              title="Nuovo post"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          )}
        </div>

        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap gap-3">
          {/* Artist filter — staff only */}
          {isStaff && (
            <select
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="rounded-lg border border-[#1E1E30] bg-[#13131F] px-3 py-1.5 text-sm text-white focus:border-[#F5C518]/60 focus:outline-none"
            >
              <option value="">Tutti gli artisti</option>
              {artistOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PostStatus | '')}
            className="rounded-lg border border-[#1E1E30] bg-[#13131F] px-3 py-1.5 text-sm text-white focus:border-[#F5C518]/60 focus:outline-none"
          >
            <option value="">Tutti gli stati</option>
            {POST_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Platform filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as PostPlatform | '')}
            className="rounded-lg border border-[#1E1E30] bg-[#13131F] px-3 py-1.5 text-sm text-white focus:border-[#F5C518]/60 focus:outline-none"
          >
            <option value="">Tutte le piattaforme</option>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Reset filters */}
          {(artistFilter || statusFilter || platformFilter) && (
            <button
              type="button"
              onClick={() => {
                setArtistFilter('')
                setStatusFilter('')
                setPlatformFilter('')
              }}
              className="rounded-lg border border-[#1E1E30] bg-[#13131F] px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Rimuovi filtri
            </button>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Calendar */}
        <CalendarView
          posts={posts}
          onEventClick={handleEventClick}
          onDateClick={isStaff ? handleDateClick : undefined}
          isLoading={isLoading}
        />

        {/* Empty state (shown when loaded and no posts) */}
        {!isLoading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="h-12 w-12 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-3 text-gray-500">Nessun post trovato</p>
            {isStaff && (
              <Link
                href="/posts/new"
                className="mt-4 rounded-lg bg-[#F5C518] px-4 py-2 text-sm font-medium text-black hover:bg-[#F5C518]/90"
              >
                Crea il primo post
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
