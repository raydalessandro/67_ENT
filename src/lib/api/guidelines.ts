import type { GuidelineSection, GuidelineItem } from '@/types/models'
import type { ApiResult, CreateSectionInput, CreateGuidelineInput, UpdateGuidelineInput } from '@/types/api'
import { query, createError } from '@/lib/api/errors'
import { createBrowserClient } from '@/lib/supabase/client'

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${suffix}`
}

export async function getSections(): Promise<ApiResult<GuidelineSection[]>> {
  const supabase = createBrowserClient()
  const result = await query<GuidelineSection[]>(
    supabase.from('guideline_sections').select('*').order('display_order')
  )
  if (!result.ok) return result
  return { ok: true, data: result.data ?? [] }
}

export async function createSection(
  input: CreateSectionInput
): Promise<ApiResult<GuidelineSection>> {
  const supabase = createBrowserClient()
  const slug = generateSlug(input.title)
  return query<GuidelineSection>(
    supabase
      .from('guideline_sections')
      .insert({ ...input, slug })
      .select()
      .single()
  )
}

export async function getItems(sectionId: string): Promise<ApiResult<GuidelineItem[]>> {
  const supabase = createBrowserClient()
  const result = await query<GuidelineItem[]>(
    supabase
      .from('guideline_items_full')
      .select('*')
      .eq('section_id', sectionId)
      .order('display_order')
  )
  if (!result.ok) return result
  return { ok: true, data: result.data ?? [] }
}

export async function createItem(
  input: CreateGuidelineInput
): Promise<ApiResult<GuidelineItem>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const { createError } = await import('@/lib/api/errors')
    return { ok: false, error: createError('UNAUTHORIZED', 'Not authenticated', 'Devi effettuare il login') }
  }
  return query<GuidelineItem>(
    supabase.from('guideline_items').insert({ ...input, created_by: user.id }).select().single()
  )
}

export async function updateItem(
  id: string,
  input: UpdateGuidelineInput
): Promise<ApiResult<GuidelineItem>> {
  const supabase = createBrowserClient()
  return query<GuidelineItem>(
    supabase.from('guideline_items').update(input).eq('id', id).select().single()
  )
}

export async function markRead(itemId: string): Promise<ApiResult<void>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const { createError } = await import('@/lib/api/errors')
    return { ok: false, error: createError('UNAUTHORIZED', 'Not authenticated', 'Devi effettuare il login') }
  }
  const { error } = await supabase
    .from('guideline_reads')
    .upsert(
      { guideline_item_id: itemId, user_id: user.id },
      { onConflict: 'user_id,guideline_item_id' }
    )
  if (error) {
    const { mapSupabaseError } = await import('@/lib/api/errors')
    return { ok: false, error: mapSupabaseError(error) }
  }
  return { ok: true, data: undefined }
}

export async function getUnreadCount(sectionId?: string): Promise<ApiResult<number>> {
  const supabase = createBrowserClient()
  let q = supabase
    .from('guideline_items_full')
    .select('id')
    .eq('is_read', false)

  if (sectionId) q = q.eq('section_id', sectionId)

  const result = await query<GuidelineItem[]>(q)
  if (!result.ok) return result
  return { ok: true, data: (result.data ?? []).length }
}
