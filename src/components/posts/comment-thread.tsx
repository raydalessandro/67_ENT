'use client'

import { useState } from 'react'
import type { PostComment } from '@/types/models'
import { Button } from '@/components/ui/button'

interface CommentThreadProps {
  postId: string
  comments: PostComment[]
  onAdd: (postId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  currentUserId: string
}

export function CommentThread({
  postId,
  comments,
  onAdd,
  onDelete,
  currentUserId,
}: CommentThreadProps) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    try {
      await onAdd(postId, content)
      setInput('')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId)
    try {
      await onDelete(commentId)
    } finally {
      setDeletingId(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">
        Commenti{comments.length > 0 ? ` (${comments.length})` : ''}
      </h3>

      {/* Comment list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-600">Nessun commento ancora.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="group flex gap-3 rounded-lg border border-[#1E1E30] bg-[#0F0F1A] p-3"
            >
              {/* Avatar placeholder */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E1E30] text-xs font-medium text-gray-400">
                {(comment.user_display_name ?? 'U').charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-300">
                    {comment.user_display_name ?? 'Utente'}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(comment.created_at).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-300 whitespace-pre-wrap">{comment.content}</p>
              </div>

              {/* Delete button — own comments only */}
              {comment.user_id === currentUserId && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="shrink-0 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 disabled:opacity-50"
                  title="Elimina commento"
                >
                  {deletingId === comment.id ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add comment input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un commento... (Invio per inviare)"
          rows={2}
          className="flex-1 rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#F5C518]/60 focus:outline-none resize-none"
        />
        <Button
          type="button"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="shrink-0 bg-[#F5C518] text-black hover:bg-[#F5C518]/90 disabled:opacity-50"
        >
          {sending ? '...' : 'Invia'}
        </Button>
      </div>
    </div>
  )
}
