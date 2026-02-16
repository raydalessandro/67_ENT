// ============================================================================
// API Types — Request/Response
// ============================================================================

import type { AppError } from '@/lib/errors';
import type { PostPlatform, PostStatus, GuidelineItemType, GuidelinePriority } from './enums';

// Generic result wrapper — every API call returns this
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

// Paginated response
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── Post ──

export interface CreatePostInput {
  title: string;
  caption?: string;
  hashtags?: string;
  platform: PostPlatform;
  artist_id: string;
  scheduled_at: string;
}

export interface UpdatePostInput {
  title?: string;
  caption?: string;
  hashtags?: string;
  platform?: PostPlatform;
  scheduled_at?: string;
}

// ── Calendar ──

export interface CalendarFilters {
  artist_id?: string;
  platform?: PostPlatform;
  status?: PostStatus;
  month: number;  // 0-11
  year: number;
}

// ── Guidelines ──

export interface CreateGuidelineItemInput {
  section_id: string;
  title: string;
  content: string;
  item_type: GuidelineItemType;
  priority?: GuidelinePriority;
  valid_from?: string;
  valid_until?: string;
  target_all?: boolean;
  target_artist_ids?: string[];
}

// ── AI Chat ──

export interface AIChatRequest {
  message: string;
  session_id?: string;
}

export interface AIChatResponse {
  session_id: string;
  message: string;
  usage: {
    used_today: number;
    daily_limit: number;
    remaining: number;
  };
}
