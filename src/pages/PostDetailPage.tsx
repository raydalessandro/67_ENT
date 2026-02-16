// ============================================================================
// Post Detail Page
// ============================================================================

import { useParams } from 'react-router-dom';
import { Clock, Hash, AtSign } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { MediaGallery } from '@/components/posts/MediaGallery';
import { PostActions } from '@/components/posts/PostActions';
import { CommentsSection } from '@/components/posts/CommentsSection';
import { ErrorState, Badge, Skeleton } from '@/components/ui/Primitives';
import { usePost } from '@/hooks/usePost';
import { STATUS_CONFIG, PLATFORM_CONFIG } from '@/types/enums';
import { formatDate, formatTime } from '@/lib/utils';
import type { PostComment, PostWithDetails } from '@/types/models';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { post, media, comments, setPost, setComments, isLoading, error, refetch } = usePost(id);

  if (isLoading) {
    return (
      <>
        <Header title="Post" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Header title="Post" showBack />
        <ErrorState error={error!} onRetry={refetch} />
      </>
    );
  }

  const statusConfig = STATUS_CONFIG[post.status];
  const platformConfig = PLATFORM_CONFIG[post.platform];

  const handlePostUpdate = (updated: PostWithDetails) => {
    setPost(updated);
  };

  const handleNewComment = (comment: PostComment) => {
    setComments((prev) => [...prev, comment]);
  };

  return (
    <>
      <Header title={post.title} showBack />

      <div className="p-4 space-y-6 pb-8">
        {/* Media */}
        <MediaGallery media={media} />

        {/* Status & Platform badges */}
        <div className="flex flex-wrap gap-2">
          <Badge color={statusConfig.color} bgColor={statusConfig.bgColor}>
            {statusConfig.label}
          </Badge>
          <Badge color={platformConfig.color} bgColor={platformConfig.color + '20'}>
            {platformConfig.label}
          </Badge>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white">{post.title}</h2>

        {/* Meta info */}
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <AtSign className="w-4 h-4" />
            <span>{post.artist_name}</span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: post.artist_color }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {formatDate(post.scheduled_at)} alle {formatTime(post.scheduled_at)}
            </span>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Caption</h3>
            <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">
              {post.caption}
            </p>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Hashtags
            </h3>
            <p className="text-sm text-indigo-400 break-words">
              {post.hashtags}
            </p>
          </div>
        )}

        {/* Rejection reason */}
        {post.status === 'rejected' && post.rejection_reason && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <h3 className="text-xs font-semibold text-red-400 uppercase mb-1">Motivo del rifiuto</h3>
            <p className="text-sm text-red-300">{post.rejection_reason}</p>
          </div>
        )}

        {/* Actions */}
        <PostActions post={post} onUpdate={handlePostUpdate} />

        {/* Divider */}
        <hr className="border-gray-800" />

        {/* Comments */}
        <CommentsSection
          postId={post.id}
          comments={comments}
          onNewComment={handleNewComment}
        />
      </div>
    </>
  );
}
