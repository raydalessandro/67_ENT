import type { PostPlatform, PostStatus, GuidelineType } from './models'

// ── Result Type ──

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError }

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'CONSTRAINT_VIOLATION'
  | 'STORAGE_ERROR'
  | 'RATE_LIMITED'
  | 'AI_PROVIDER_ERROR'
  | 'INSTAGRAM_API_ERROR'
  | 'UNKNOWN'

export interface AppError {
  code: ErrorCode
  message: string
  userMessage: string
  isRetryable: boolean
}

// ── Post Inputs ──

export interface CreatePostInput {
  artist_id: string
  title: string
  caption?: string
  hashtags?: string
  platforms: PostPlatform[]
  scheduled_date?: string
}

export interface UpdatePostInput {
  title?: string
  caption?: string
  hashtags?: string
  platforms?: PostPlatform[]
  scheduled_date?: string
}

export interface PostFilters {
  artist_id?: string
  status?: PostStatus
  platform?: PostPlatform
  from_date?: string
  to_date?: string
}

// ── Guideline Inputs ──

export interface CreateSectionInput {
  title: string
  icon?: string
  description?: string
}

export interface CreateGuidelineInput {
  section_id: string
  title: string
  content: string
  item_type?: GuidelineType
  priority?: number
  valid_from?: string
  valid_until?: string
  target_artist_ids?: string[]
}

export interface UpdateGuidelineInput {
  title?: string
  content?: string
  item_type?: GuidelineType
  priority?: number
  valid_from?: string
  valid_until?: string
  target_artist_ids?: string[]
}

// ── AI Inputs ──

export interface UpdateAiConfigInput {
  is_enabled?: boolean
  provider?: string
  model_name?: string
  temperature?: number
  max_tokens?: number
  daily_message_limit?: number
  system_prompt_identity?: string
  system_prompt_activity?: string
  system_prompt_ontology?: string
  system_prompt_marketing?: string
  system_prompt_boundaries?: string
  system_prompt_extra?: string
}

export interface AiChatRequest {
  message: string
}

export interface AiChatResponse {
  reply: string
  remaining_messages: number
}

// ── Notifications ──

export interface PushSubscriptionInput {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
}

// ── Analytics ──

export interface AnalyticsTimeRange {
  period: 'week' | 'month' | 'quarter'
}
