import type { Post, PostWithDetails, PostMedia, PostComment } from '@/types/models'
import type { ApiResult, CreatePostInput, UpdatePostInput, PostFilters } from '@/types/api'
import { query, createError } from '@/lib/api/errors'
import { createBrowserClient } from '@/lib/supabase/client'

export async function getPosts(filters?: PostFilters): Promise<ApiResult<PostWithDetails[]>> {
  const supabase = createBrowserClient()
  let q = supabase
    .from('posts_with_details')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.artist_id) q = q.eq('artist_id', filters.artist_id)
  if (filters?.status) q = q.eq('status', filters.status)
  if (filters?.platform) q = q.contains('platforms', [filters.platform])
  if (filters?.from_date) q = q.gte('scheduled_date', filters.from_date)
  if (filters?.to_date) q = q.lte('scheduled_date', filters.to_date)

  const result = await query<PostWithDetails[]>(q)
  if (!result.ok) return result
  return { ok: true, data: result.data ?? [] }
}

export async function getPost(
  id: string
): Promise<ApiResult<Post & { media: PostMedia[]; comments: PostComment[] }>> {
  const supabase = createBrowserClient()
  const postResult = await query<Post>(
    supabase.from('posts').select('*').eq('id', id).single()
  )
  if (!postResult.ok) return postResult

  const mediaResult = await query<PostMedia[]>(
    supabase.from('post_media').select('*').eq('post_id', id).order('display_order')
  )
  const commentsResult = await query<PostComment[]>(
    supabase.from('post_comments').select('*').eq('post_id', id).order('created_at')
  )

  return {
    ok: true,
    data: {
      ...postResult.data,
      media: mediaResult.ok ? mediaResult.data : [],
      comments: commentsResult.ok ? commentsResult.data : [],
    },
  }
}

export async function createPost(input: CreatePostInput): Promise<ApiResult<Post>> {
  const supabase = createBrowserClient()
  return query<Post>(supabase.from('posts').insert(input).select().single())
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<ApiResult<Post>> {
  const supabase = createBrowserClient()
  return query<Post>(
    supabase.from('posts').update(input).eq('id', id).select().single()
  )
}

export async function sendForReview(id: string): Promise<ApiResult<Post>> {
  const supabase = createBrowserClient()
  const result = await query<Post>(
    supabase
      .from('posts')
      .update({ status: 'in_review' })
      .eq('id', id)
      .eq('status', 'draft')
      .select()
      .single()
  )
  if (!result.ok) return result

  // Notification insert — non-fatal
  try {
    await supabase.from('notifications').insert({
      type: 'post_review',
      related_post_id: id,
      title: 'Post inviato in revisione',
      message: `Il post è stato inviato in revisione.`,
    })
  } catch {
    // non-fatal
  }

  return result
}

export async function approve(id: string): Promise<ApiResult<Post>> {
  const supabase = createBrowserClient()
  const result = await query<Post>(
    supabase
      .from('posts')
      .update({ status: 'approved' })
      .eq('id', id)
      .eq('status', 'in_review')
      .select()
      .single()
  )
  if (!result.ok) return result

  // Notification insert — non-fatal
  try {
    await supabase.from('notifications').insert({
      type: 'post_approved',
      related_post_id: id,
      title: 'Post approvato',
      message: `Il post è stato approvato.`,
    })
  } catch {
    // non-fatal
  }

  return result
}

export async function reject(id: string, reason: string): Promise<ApiResult<Post>> {
  if (!reason.trim().length) {
    return {
      ok: false,
      error: createError('INVALID_INPUT', 'Rejection reason cannot be empty'),
    }
  }

  const supabase = createBrowserClient()
  const result = await query<Post>(
    supabase
      .from('posts')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .eq('status', 'in_review')
      .select()
      .single()
  )
  if (!result.ok) return result

  // Notification insert — non-fatal
  try {
    await supabase.from('notifications').insert({
      type: 'post_rejected',
      related_post_id: id,
      title: 'Post rifiutato',
      message: reason,
    })
  } catch {
    // non-fatal
  }

  return result
}

export async function markPublished(id: string): Promise<ApiResult<Post>> {
  const supabase = createBrowserClient()
  return query<Post>(
    supabase
      .from('posts')
      .update({ status: 'published' })
      .eq('id', id)
      .eq('status', 'approved')
      .select()
      .single()
  )
}

export async function getComments(postId: string): Promise<ApiResult<PostComment[]>> {
  const supabase = createBrowserClient()
  const result = await query<PostComment[]>(
    supabase.from('post_comments').select('*').eq('post_id', postId).order('created_at')
  )
  if (!result.ok) return result
  return { ok: true, data: result.data ?? [] }
}

export async function addComment(
  postId: string,
  content: string
): Promise<ApiResult<PostComment>> {
  const supabase = createBrowserClient()
  return query<PostComment>(
    supabase.from('post_comments').insert({ post_id: postId, content }).select().single()
  )
}

export async function deleteComment(commentId: string): Promise<ApiResult<void>> {
  const supabase = createBrowserClient()
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
  if (error) {
    const { mapSupabaseError } = await import('@/lib/api/errors')
    return { ok: false, error: mapSupabaseError(error) }
  }
  return { ok: true, data: undefined }
}
