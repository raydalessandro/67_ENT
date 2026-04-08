'use client'

import type { PostWithDetails } from '@/types/models'
import { POST_STATUSES, PLATFORMS } from '@/lib/constants'

const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  in_review: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-300 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border border-red-500/30',
  published: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
}

interface PostCardProps {
  post: PostWithDetails
  onClick: (post: PostWithDetails) => void
}

export function PostCard({ post, onClick }: PostCardProps) {
  const statusMeta = POST_STATUSES.find((s) => s.value === post.status)
  const badgeClass = STATUS_BADGE_CLASSES[post.status] ?? STATUS_BADGE_CLASSES.draft

  const scheduledLabel = post.scheduled_date
    ? new Date(post.scheduled_date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Data non impostata'

  return (
    <button
      type="button"
      onClick={() => onClick(post)}
      className="w-full text-left rounded-xl border border-[#1E1E30] bg-[#13131F] p-4 hover:border-[#F5C518]/40 hover:bg-[#13131F]/80 transition-all duration-150 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Artist color dot */}
        <span
          className="mt-1 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: post.artist_color }}
          title={post.artist_name}
        />

        <div className="flex-1 min-w-0">
          {/* Title + status badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="truncate text-sm font-medium text-white">{post.title}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
              {statusMeta?.label ?? post.status}
            </span>
          </div>

          {/* Artist name */}
          <p className="mt-0.5 text-xs text-gray-400">{post.artist_name}</p>

          {/* Scheduled date */}
          <p className="mt-1 text-xs text-gray-500">{scheduledLabel}</p>

          {/* Platform badges */}
          {post.platforms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.platforms.map((p) => {
                const label = PLATFORMS.find((pl) => pl.value === p)?.label ?? p
                return (
                  <span
                    key={p}
                    className="rounded bg-[#1E1E30] px-1.5 py-0.5 text-[10px] text-gray-400"
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
