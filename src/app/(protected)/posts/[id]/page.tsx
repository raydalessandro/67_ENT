'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle, XCircle, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { usePost } from '@/hooks/use-posts'
import { useAuth } from '@/hooks/use-auth'
import { CommentThread } from '@/components/posts/comment-thread'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  sendForReview,
  approve,
  reject,
  markPublished,
  addComment,
  deleteComment,
} from '@/lib/api/posts'
import { POST_STATUSES, PLATFORMS } from '@/lib/constants'
import type { PostStatus } from '@/types/models'

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Bozza',
  in_review: 'In revisione',
  approved: 'Approvato',
  rejected: 'Rifiutato',
  published: 'Pubblicato',
}

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: 'bg-gray-600/20 text-gray-400',
  in_review: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  published: 'bg-blue-500/20 text-blue-400',
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user, isStaff } = useAuth()

  const { post, isLoading, error, refetch } = usePost(id)

  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  async function handleSendForReview() {
    setActionLoading(true)
    const result = await sendForReview(id)
    if (result.ok) {
      toast.success('Post inviato in revisione')
      await refetch()
    } else {
      toast.error(result.error.userMessage)
    }
    setActionLoading(false)
  }

  async function handleApprove() {
    setActionLoading(true)
    const result = await approve(id)
    if (result.ok) {
      toast.success('Post approvato')
      await refetch()
    } else {
      toast.error(result.error.userMessage)
    }
    setActionLoading(false)
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast.error('Inserisci un motivo di rifiuto')
      return
    }
    setActionLoading(true)
    const result = await reject(id, rejectReason)
    if (result.ok) {
      toast.success('Post rifiutato')
      setShowRejectDialog(false)
      setRejectReason('')
      await refetch()
    } else {
      toast.error(result.error.userMessage)
    }
    setActionLoading(false)
  }

  async function handleMarkPublished() {
    setActionLoading(true)
    const result = await markPublished(id)
    if (result.ok) {
      toast.success('Post segnato come pubblicato')
      await refetch()
    } else {
      toast.error(result.error.userMessage)
    }
    setActionLoading(false)
  }

  async function handleAddComment(postId: string, content: string) {
    const result = await addComment(postId, content)
    if (result.ok) {
      await refetch()
    } else {
      toast.error(result.error.userMessage)
    }
  }

  async function handleDeleteComment(commentId: string) {
    const result = await deleteComment(commentId)
    if (result.ok) {
      await refetch()
    } else {
      toast.error(result.error.userMessage)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error ?? 'Post non trovato'}
        </div>
        <Button
          onClick={() => router.back()}
          className="mt-4 bg-[#1E1E30] text-white hover:bg-[#1E1E30]/80"
        >
          Torna indietro
        </Button>
      </div>
    )
  }

  const platformLabels = post.platforms
    .map((p) => PLATFORMS.find((pl) => pl.value === p)?.label ?? p)
    .join(', ')

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/calendar"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Calendario
        </Link>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">{post.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Artista:{' '}
              <span style={{ color: post.artist_color ?? '#F5C518' }}>
                {(post as any).artist_name ?? post.artist_id}
              </span>
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[post.status]}`}
          >
            {STATUS_LABELS[post.status]}
          </span>
        </div>

        {/* Media gallery */}
        {post.media.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {post.media.map((item) => (
              <div key={item.id} className="relative aspect-square">
                {item.file_type === 'video' ? (
                  <video
                    src={item.file_url}
                    className="h-full w-full rounded-lg object-cover"
                    controls
                    muted
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail_url ?? item.file_url}
                    alt="Media"
                    className="h-full w-full rounded-lg object-cover"
                  />
                )}
                {item.file_type === 'video' && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[10px] text-white">
                    VIDEO
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post details */}
        <div className="mb-6 rounded-xl border border-[#1E1E30] bg-[#13131F] p-5 space-y-4">
          {/* Platforms */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Piattaforme
            </p>
            <p className="text-sm text-gray-300">{platformLabels || '—'}</p>
          </div>

          {/* Scheduled date */}
          {post.scheduled_date && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Data programmata
              </p>
              <p className="text-sm text-gray-300">
                {new Date(post.scheduled_date).toLocaleString('it-IT', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Caption
              </p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{post.caption}</p>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Hashtag
              </p>
              <p className="text-sm text-[#F5C518]/80 whitespace-pre-wrap">{post.hashtags}</p>
            </div>
          )}

          {/* Rejection reason */}
          {post.status === 'rejected' && post.rejection_reason && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">
                Motivo rifiuto
              </p>
              <p className="text-sm text-red-300">{post.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Workflow actions */}
        <div className="mb-8 flex flex-wrap gap-2">
          {/* Artist: send for review when draft */}
          {!isStaff && post.status === 'draft' && (
            <Button
              onClick={handleSendForReview}
              disabled={actionLoading}
              className="bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50"
            >
              <Send className="mr-2 h-4 w-4" />
              Invia in revisione
            </Button>
          )}

          {/* Staff: approve when in_review */}
          {isStaff && post.status === 'in_review' && (
            <>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approva
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={actionLoading}
                className="bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rifiuta
              </Button>
            </>
          )}

          {/* Staff: mark published when approved */}
          {isStaff && post.status === 'approved' && (
            <Button
              onClick={handleMarkPublished}
              disabled={actionLoading}
              className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Globe className="mr-2 h-4 w-4" />
              Segna come pubblicato
            </Button>
          )}
        </div>

        {/* Reject dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-xl border border-[#1E1E30] bg-[#13131F] p-6">
              <h3 className="mb-4 text-base font-semibold text-white">Motivo rifiuto</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Spiega perché il post viene rifiutato..."
                rows={4}
                className="w-full rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#F5C518]/60 focus:outline-none resize-none"
              />
              <div className="mt-4 flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setShowRejectDialog(false)
                    setRejectReason('')
                  }}
                  className="bg-[#1E1E30] text-white hover:bg-[#1E1E30]/80"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                >
                  Conferma rifiuto
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Comment thread */}
        <div className="rounded-xl border border-[#1E1E30] bg-[#13131F] p-5">
          <CommentThread
            postId={id}
            comments={post.comments}
            onAdd={handleAddComment}
            onDelete={handleDeleteComment}
            currentUserId={user?.id ?? ''}
          />
        </div>
      </div>
    </div>
  )
}
