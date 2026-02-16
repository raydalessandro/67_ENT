// ============================================================================
// Comments Section
// ============================================================================

import { useState } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatRelativeTime } from '@/lib/utils';
import type { PostComment } from '@/types/models';

interface Props {
  postId: string;
  comments: PostComment[];
  onNewComment: (comment: PostComment) => void;
}

export function CommentsSection({ postId, comments, onNewComment }: Props) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setIsSubmitting(true);

    const result = await api.posts.addComment(postId, user.id, content.trim());
    setIsSubmitting(false);

    if (result.ok) {
      onNewComment(result.data);
      setContent('');
    } else {
      toast.error(result.error.userMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
        <MessageSquare className="w-4 h-4" />
        Commenti ({comments.length})
      </h3>

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                {(c.user_name ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-white">
                    {c.user_name ?? 'Utente'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(c.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-0.5 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Nessun commento</p>
      )}

      {/* Input */}
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un commento..."
          rows={1}
          className="flex-1 resize-none px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl
                     text-white placeholder-gray-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-24 overflow-y-auto"
          style={{ minHeight: '44px' }}
          data-testid="comment-input"
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="flex-shrink-0 w-11 h-11 rounded-full bg-indigo-600
                     flex items-center justify-center
                     disabled:opacity-50 active:scale-95 transition-all"
          data-testid="comment-send"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
