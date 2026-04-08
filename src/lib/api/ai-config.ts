import type { AiAgentConfig } from '@/types/models'
import type { ApiResult, UpdateAiConfigInput } from '@/types/api'
import { query } from '@/lib/api/errors'
import { createBrowserClient } from '@/lib/supabase/client'

export async function getAiConfigs(): Promise<ApiResult<AiAgentConfig[]>> {
  const supabase = createBrowserClient()
  const result = await query<AiAgentConfig[]>(
    supabase.from('ai_agent_configs').select('*').order('created_at')
  )
  if (!result.ok) return result
  return { ok: true, data: result.data ?? [] }
}

export async function getAiConfig(artistId: string): Promise<ApiResult<AiAgentConfig>> {
  const supabase = createBrowserClient()
  return query<AiAgentConfig>(
    supabase.from('ai_agent_configs').select('*').eq('artist_id', artistId).single()
  )
}

export async function updateAiConfig(
  artistId: string,
  input: UpdateAiConfigInput
): Promise<ApiResult<AiAgentConfig>> {
  const supabase = createBrowserClient()
  return query<AiAgentConfig>(
    supabase
      .from('ai_agent_configs')
      .update(input)
      .eq('artist_id', artistId)
      .select()
      .single()
  )
}
