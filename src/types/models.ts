// ── Auth & Users ──

export type UserRole = 'admin' | 'manager' | 'artist'

export interface User {
  id: string
  email: string
  display_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Artist {
  id: string
  user_id: string
  name: string
  color: string
  instagram_handle: string | null
  tiktok_handle: string | null
  youtube_handle: string | null
  spotify_handle: string | null
  is_active: boolean
  deactivated_at: string | null
  created_at: string
  updated_at: string
}

export interface ArtistWithSecrets extends Artist {
  instagram_token: string | null
  instagram_token_expires_at: string | null
}

// ── Posts ──

export type PostStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'published'

export type PostPlatform =
  | 'instagram_feed' | 'instagram_story' | 'instagram_reel'
  | 'tiktok' | 'youtube' | 'spotify'

export interface Post {
  id: string
  artist_id: string
  title: string
  caption: string | null
  hashtags: string | null
  platforms: PostPlatform[]
  status: PostStatus
  scheduled_date: string | null
  created_by: string
  approved_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface PostWithDetails extends Post {
  artist_name: string
  artist_color: string
  media_count: number
  comment_count: number
}

export interface PostMedia {
  id: string
  post_id: string
  file_url: string
  file_type: 'image' | 'video'
  file_size: number | null
  display_order: number
  thumbnail_url: string | null
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user_display_name?: string
}

export interface PostHistory {
  id: string
  post_id: string
  old_status: PostStatus | null
  new_status: PostStatus
  changed_by: string
  reason: string | null
  created_at: string
}

// ── Notifications ──

export type NotificationType =
  | 'post_review' | 'post_approved' | 'post_rejected'
  | 'post_published' | 'new_guideline' | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  related_post_id: string | null
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ── Toolkit ──

export type GuidelineType = 'permanent' | 'campaign' | 'update'

export interface GuidelineSection {
  id: string
  title: string
  slug: string
  icon: string
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface GuidelineItem {
  id: string
  section_id: string
  title: string
  content: string
  item_type: GuidelineType
  priority: number
  valid_from: string | null
  valid_until: string | null
  display_order: number
  created_by: string
  created_at: string
  updated_at: string
  is_read?: boolean
}

// ── AI Chat ──

export interface AiAgentConfig {
  id: string
  artist_id: string
  is_enabled: boolean
  provider: string
  model_name: string
  temperature: number
  max_tokens: number
  daily_message_limit: number
  system_prompt_identity: string
  system_prompt_activity: string
  system_prompt_ontology: string
  system_prompt_marketing: string
  system_prompt_boundaries: string
  system_prompt_extra: string
  created_at: string
  updated_at: string
}

export interface AiChatMessage {
  id: string
  artist_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  session_date: string
  created_at: string
}

// ── Instagram Analytics ──

export interface InstagramAccount {
  id: string
  username: string
  name: string | null
  biography: string | null
  followers_count: number
  follows_count: number
  media_count: number
  profile_picture_url: string | null
  website: string | null
}

export interface InstagramMedia {
  id: string
  caption: string | null
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  permalink: string
  thumbnail_url: string | null
  timestamp: string
  username: string
  like_count: number
  comments_count: number
}

export interface InstagramInsight {
  name: string
  period: 'day' | 'week' | 'days_28' | 'lifetime'
  values: Array<{ value: number; end_time: string }>
  title: string | null
  description: string | null
}

export interface DerivedMetrics {
  engagementRate: number
  avgLikesPerPost: number
  avgCommentsPerPost: number
  totalEngagement: number
  bestPostingDay: string
  peakEngagementHour: number
  contentTypePerformance: Record<
    'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM',
    { count: number; avgEngagement: number }
  >
  postFrequencyPerWeek: number
}
