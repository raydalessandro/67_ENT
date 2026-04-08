import type { PostMedia } from '@/types/models'
import type { ApiResult } from '@/types/api'
import { createError } from '@/lib/api/errors'
import { createBrowserClient } from '@/lib/supabase/client'

export async function uploadMedia(
  postId: string,
  file: File,
  order: number
): Promise<ApiResult<PostMedia>> {
  const supabase = createBrowserClient()

  const ext = file.name.split('.').pop() ?? 'bin'
  const filePath = `posts/${postId}/${Date.now()}-${order}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('post-media')
    .upload(filePath, file)

  if (uploadError) {
    return {
      ok: false,
      error: createError('STORAGE_ERROR', uploadError.message),
    }
  }

  const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(filePath)

  const fileType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'

  const { data: mediaRow, error: insertError } = await supabase
    .from('post_media')
    .insert({
      post_id: postId,
      file_url: urlData.publicUrl,
      file_type: fileType,
      file_size: file.size,
      display_order: order,
    })
    .select()
    .single()

  if (insertError) {
    return {
      ok: false,
      error: createError('UNKNOWN', insertError.message),
    }
  }

  return { ok: true, data: mediaRow as PostMedia }
}

export async function deleteMedia(
  mediaId: string,
  filePath: string
): Promise<ApiResult<void>> {
  const supabase = createBrowserClient()

  const { error: storageError } = await supabase.storage
    .from('post-media')
    .remove([filePath])

  if (storageError) {
    return {
      ok: false,
      error: createError('STORAGE_ERROR', storageError.message),
    }
  }

  const { error: dbError } = await supabase
    .from('post_media')
    .delete()
    .eq('id', mediaId)

  if (dbError) {
    const { mapSupabaseError } = await import('@/lib/api/errors')
    return { ok: false, error: mapSupabaseError(dbError) }
  }

  return { ok: true, data: undefined }
}

export function getMediaUrl(path: string): string {
  const supabase = createBrowserClient()
  const { data } = supabase.storage.from('post-media').getPublicUrl(path)
  return data.publicUrl
}
