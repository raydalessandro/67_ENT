// ============================================================================
// Post Actions — Approve / Reject / Publish / Send for Review
// ============================================================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X, Send, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { rejectSchema, type RejectInput } from '@/lib/validation';
import { useAuthStore } from '@/stores/authStore';
import type { PostWithDetails } from '@/types/models';

interface Props {
  post: PostWithDetails;
  onUpdate: (post: PostWithDetails) => void;
}

export function PostActions({ post, onUpdate }: Props) {
  const { isStaff, artist } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const isOwner = artist?.id === post.artist_id;

  // Determine available actions based on role and status
  const canSendForReview = isStaff && post.status === 'draft';
  const canApproveReject = isOwner && post.status === 'in_review';
  const canPublish = isStaff && post.status === 'approved';

  const doAction = async (
    action: () => ReturnType<typeof api.posts.approve>,
    successMsg: string,
    key: string,
  ) => {
    setLoading(key);
    const result = await action();
    setLoading(null);

    if (result.ok) {
      onUpdate({ ...post, ...result.data });
      toast.success(successMsg);
    } else {
      toast.error(result.error.userMessage);
    }
  };

  if (!canSendForReview && !canApproveReject && !canPublish) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canSendForReview && (
          <ActionButton
            onClick={() => doAction(() => api.posts.sendForReview(post.id), 'Inviato in revisione', 'review')}
            loading={loading === 'review'}
            icon={Send}
            label="Invia per approvazione"
            variant="primary"
          />
        )}

        {canApproveReject && (
          <>
            <ActionButton
              onClick={() => doAction(() => api.posts.approve(post.id), 'Post approvato!', 'approve')}
              loading={loading === 'approve'}
              icon={Check}
              label="Approva"
              variant="success"
            />
            <ActionButton
              onClick={() => setShowRejectModal(true)}
              loading={false}
              icon={X}
              label="Rifiuta"
              variant="danger"
            />
          </>
        )}

        {canPublish && (
          <ActionButton
            onClick={() => doAction(() => api.posts.markPublished(post.id), 'Post pubblicato!', 'publish')}
            loading={loading === 'publish'}
            icon={Globe}
            label="Segna come pubblicato"
            variant="primary"
          />
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          postId={post.id}
          onClose={() => setShowRejectModal(false)}
          onRejected={(updated) => {
            onUpdate({ ...post, ...updated });
            setShowRejectModal(false);
          }}
        />
      )}
    </>
  );
}

// ── Action Button ──

function ActionButton({
  onClick,
  loading,
  icon: Icon,
  label,
  variant,
}: {
  onClick: () => void;
  loading: boolean;
  icon: React.ElementType;
  label: string;
  variant: 'primary' | 'success' | 'danger';
}) {
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700',
    success: 'bg-emerald-600 hover:bg-emerald-700',
    danger: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white
                  disabled:opacity-50 active:scale-95 transition-all
                  ${variantStyles[variant]}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}

// ── Reject Modal ──

function RejectModal({
  postId,
  onClose,
  onRejected,
}: {
  postId: string;
  onClose: () => void;
  onRejected: (post: any) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectInput>({
    resolver: zodResolver(rejectSchema),
  });

  const onSubmit = async (data: RejectInput) => {
    setIsSubmitting(true);
    const result = await api.posts.reject(postId, data.reason);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success('Post rifiutato');
      onRejected(result.data);
    } else {
      toast.error(result.error.userMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div
        className="w-full max-w-md bg-gray-900 rounded-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">Rifiuta post</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <textarea
              {...register('reason')}
              placeholder="Motivo del rifiuto..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl
                         text-white placeholder-gray-500 resize-none
                         focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
              data-testid="reject-reason"
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-400">{errors.reason.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium
                         hover:bg-gray-700 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium
                         hover:bg-red-700 disabled:opacity-50 active:scale-95 transition-all"
              data-testid="reject-confirm"
            >
              {isSubmitting ? 'Rifiutando...' : 'Rifiuta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
