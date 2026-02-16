// ============================================================================
// usePost — load post details, media, comments
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AppError } from '@/lib/errors';
import type { PostWithDetails, PostMedia, PostComment } from '@/types/models';

export function usePost(id: string | undefined) {
  const [post, setPost] = useState<PostWithDetails | null>(null);
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    const [postResult, mediaResult, commentsResult] = await Promise.all([
      api.posts.getById(id),
      api.posts.getMedia(id),
      api.posts.getComments(id),
    ]);

    if (postResult.ok) {
      setPost(postResult.data);
    } else {
      setError(postResult.error);
    }

    if (mediaResult.ok) setMedia(mediaResult.data);
    if (commentsResult.ok) setComments(commentsResult.data);

    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { post, media, comments, setPost, setComments, isLoading, error, refetch: fetch };
}
