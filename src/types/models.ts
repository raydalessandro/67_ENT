// ============================================================================
// Domain Models
// ============================================================================

import type {
  UserRole, PostStatus, PostPlatform, NotificationType,
  GuidelineItemType, GuidelinePriority, AIChatRole, ThumbnailStatus,
} from './enums';

// ── Auth & Users ──

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Artist {
  id: string;
  user_id: string | null;
  name: string;
  bio: string | null;
  color: string;
  instagram_url: string | null;
  spotify_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  is_label: boolean;
  created_at: string;
  updated_at: string;
}

// ── Posts ──

export interface Post {
  id: string;
  title: string;
  caption: string | null;
  hashtags: string | null;
  platform: PostPlatform;
  status: PostStatus;
  artist_id: string;
  created_by: string;
  scheduled_at: string;
  published_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithDetails extends Post {
  artist_name: string;
  artist_color: string;
  created_by_name: string;
  media_count: number;
  comment_count: number;
}

export interface PostMedia {
  id: string;
  post_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  sort_order: number;
  thumbnail_path: string | null;
  thumbnail_status: ThumbnailStatus;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_system: boolean;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface PostHistory {
  id: string;
  post_id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user_name?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  platform: PostPlatform;
  status: PostStatus;
  scheduled_at: string;
  artist_id: string;
  artist_name: string;
  artist_color: string;
}

// ── Notifications ──

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ── Guidelines / Toolkit ──

export interface GuidelineSection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GuidelineItem {
  id: string;
  section_id: string;
  title: string;
  content: string;
  item_type: GuidelineItemType;
  priority: GuidelinePriority;
  valid_from: string | null;
  valid_until: string | null;
  target_all: boolean;
  attachment_url: string | null;
  attachment_name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GuidelineItemFull extends GuidelineItem {
  section_title: string;
  section_slug: string;
  section_icon: string;
  section_sort_order: number;
  created_by_name: string;
  is_read: boolean;
}

// ── AI Chat ──

export interface AIAgentConfig {
  id: string;
  artist_id: string;
  is_enabled: boolean;
  model: string;
  temperature: number;
  max_tokens: number;
  daily_message_limit: number;
  prompt_identity: string | null;
  prompt_activity: string | null;
  prompt_ontology: string | null;
  prompt_marketing: string | null;
  prompt_boundaries: string | null;
  prompt_extra: string | null;
  configured_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIChatSession {
  id: string;
  artist_id: string;
  user_id: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIChatSessionAdmin extends AIChatSession {
  artist_name: string;
  artist_color: string;
  user_name: string;
  message_count: number;
  last_message_at: string | null;
  total_tokens: number;
}

export interface AIChatMessage {
  id: string;
  session_id: string;
  role: AIChatRole;
  content: string;
  tokens_used: number | null;
  model_used: string | null;
  response_time_ms: number | null;
  created_at: string;
}

export interface AIUsageInfo {
  daily_limit: number;
  used_today: number;
  remaining: number;
  is_enabled: boolean;
}

export interface AIUsageStats {
  artist_id: string;
  artist_name: string;
  artist_color: string;
  is_enabled: boolean;
  daily_message_limit: number;
  used_today: number;
  used_this_week: number;
  used_this_month: number;
  tokens_this_month: number;
  total_sessions: number;
}
