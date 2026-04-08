import type { Notification } from '@/types/models'
import type { ApiResult, PushSubscriptionInput } from '@/types/api'
import { query } from '@/lib/api/errors'
import { createBrowserClient } from '@/lib/supabase/client'

export async function getNotifications(): Promise<ApiResult<Notification[]>> {
  const supabase = createBrowserClient()
  const result = await query<Notification[]>(
    supabase.from('notifications').select('*').order('created_at', { ascending: false })
  )
  if (!result.ok) return result
  return { ok: true, data: result.data ?? [] }
}

export async function markRead(id: string): Promise<ApiResult<void>> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
  if (error) {
    const { mapSupabaseError } = await import('@/lib/api/errors')
    return { ok: false, error: mapSupabaseError(error) }
  }
  return { ok: true, data: undefined }
}

export async function markAllRead(): Promise<ApiResult<void>> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
  if (error) {
    const { mapSupabaseError } = await import('@/lib/api/errors')
    return { ok: false, error: mapSupabaseError(error) }
  }
  return { ok: true, data: undefined }
}

export async function getUnreadCount(): Promise<ApiResult<number>> {
  const supabase = createBrowserClient()
  const result = await query<Notification[]>(
    supabase.from('notifications').select('id').eq('is_read', false) as any
  )
  if (!result.ok) return result
  return { ok: true, data: (result.data ?? []).length }
}

export async function registerPushSubscription(
  input: PushSubscriptionInput
): Promise<ApiResult<void>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const { createError } = await import('@/lib/api/errors')
    return { ok: false, error: createError('UNAUTHORIZED', 'Not authenticated', 'Devi effettuare il login') }
  }
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      keys_p256dh: input.keys.p256dh,
      keys_auth: input.keys.auth,
      user_agent: input.userAgent,
    },
    { onConflict: 'endpoint' }
  )
  if (error) {
    const { mapSupabaseError } = await import('@/lib/api/errors')
    return { ok: false, error: mapSupabaseError(error) }
  }
  return { ok: true, data: undefined }
}

export async function unregisterPushSubscription(endpoint: string): Promise<ApiResult<void>> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
  if (error) {
    const { mapSupabaseError } = await import('@/lib/api/errors')
    return { ok: false, error: mapSupabaseError(error) }
  }
  return { ok: true, data: undefined }
}
