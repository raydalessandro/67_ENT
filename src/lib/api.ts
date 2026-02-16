// ============================================================================
// API Layer — every call returns ApiResult<T>, never throws
// ============================================================================

import { supabase } from './supabase';
import { AppError, mapSupabaseError } from './errors';
import type {
  ApiResult, CalendarFilters, CreatePostInput, AIChatRequest, AIChatResponse,
  CreateGuidelineItemInput,
} from '@/types/api';
import type {
  Post, PostWithDetails, PostMedia, PostComment, CalendarEvent,
  Notification, GuidelineSection, GuidelineItemFull, Artist,
  AIChatSessionAdmin, AIChatMessage, AIUsageInfo, AIUsageStats,
  AIAgentConfig,
} from '@/types/models';

// ── Generic query wrapper ──

async function query<T>(
  fn: () => PromiseLike<{ data: T | null; error: unknown }>
): Promise<ApiResult<T>> {
  try {
    const { data, error } = await fn();
    if (error) return { ok: false, error: mapSupabaseError(error) };
    if (data === null) return { ok: false, error: new AppError('NOT_FOUND', 'No data returned') };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: mapSupabaseError(err) };
  }
}

// ── API ──

export const api = {
  // ── Artists ──
  artists: {
    getAll: () => query<Artist[]>(() =>
      supabase.from('artists').select('*').eq('is_label', false).order('name')
    ),
  },

  // ── Calendar ──
  calendar: {
    getEvents: (filters: CalendarFilters) => {
      const startOfMonth = new Date(filters.year, filters.month, 1).toISOString();
      const endOfMonth = new Date(filters.year, filters.month + 1, 0, 23, 59, 59).toISOString();

      return query<CalendarEvent[]>(() => {
        let q = supabase
          .from('calendar_events')
          .select('*')
          .gte('scheduled_at', startOfMonth)
          .lte('scheduled_at', endOfMonth);

        if (filters.artist_id) q = q.eq('artist_id', filters.artist_id);
        if (filters.platform) q = q.eq('platform', filters.platform);
        if (filters.status) q = q.eq('status', filters.status);

        return q.order('scheduled_at');
      });
    },
  },

  // ── Posts ──
  posts: {
    getById: (id: string) => query<PostWithDetails>(() =>
      supabase.from('posts_with_details').select('*').eq('id', id).single()
    ),

    create: (input: CreatePostInput, userId: string) => query<Post>(() =>
      supabase.from('posts')
        .insert({ ...input, created_by: userId })
        .select()
        .single()
    ),

    update: (id: string, input: Partial<CreatePostInput>) => query<Post>(() =>
      supabase.from('posts').update(input).eq('id', id).select().single()
    ),

    sendForReview: (id: string) => query<Post>(() =>
      supabase.from('posts').update({ status: 'in_review' }).eq('id', id).select().single()
    ),

    approve: (id: string) => query<Post>(() =>
      supabase.from('posts').update({ status: 'approved' }).eq('id', id).select().single()
    ),

    reject: (id: string, reason: string) => query<Post>(() =>
      supabase.from('posts')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', id)
        .select()
        .single()
    ),

    markPublished: (id: string) => query<Post>(() =>
      supabase.from('posts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ),

    delete: (id: string) => query<Post>(() =>
      supabase.from('posts').delete().eq('id', id).select().single()
    ),

    // Media
    getMedia: (postId: string) => query<PostMedia[]>(() =>
      supabase.from('post_media').select('*').eq('post_id', postId).order('sort_order')
    ),

    // Comments
    getComments: (postId: string) => query<PostComment[]>(() =>
      supabase
        .from('post_comments')
        .select('*, users:user_id(display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at')
    ),

    addComment: (postId: string, userId: string, content: string) => query<PostComment>(() =>
      supabase.from('post_comments')
        .insert({ post_id: postId, user_id: userId, content })
        .select()
        .single()
    ),

    // Pending count
    getPendingCount: async (): Promise<ApiResult<number>> => {
      try {
        const { count, error } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'in_review');
        if (error) return { ok: false, error: mapSupabaseError(error) };
        return { ok: true, data: count ?? 0 };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },
  },

  // ── Guidelines ──
  guidelines: {
    getSections: () => query<GuidelineSection[]>(() =>
      supabase.from('guideline_sections').select('*').order('sort_order')
    ),

    getItems: (sectionId?: string) => {
      return query<GuidelineItemFull[]>(() => {
        let q = supabase.from('guideline_items').select('*');
        if (sectionId) q = q.eq('section_id', sectionId);
        return q.order('priority', { ascending: false }).order('created_at', { ascending: false });
      });
    },

    createItem: (input: CreateGuidelineItemInput, userId: string) => query<GuidelineItemFull>(() =>
      supabase.from('guideline_items')
        .insert({ ...input, created_by: userId })
        .select()
        .single()
    ),

    updateItem: (id: string, input: Partial<CreateGuidelineItemInput>) => query<GuidelineItemFull>(() =>
      supabase.from('guideline_items').update(input).eq('id', id).select().single()
    ),

    deleteItem: (id: string) => query<GuidelineItemFull>(() =>
      supabase.from('guideline_items').delete().eq('id', id).select().single()
    ),

    markRead: async (itemId: string): Promise<ApiResult<void>> => {
      try {
        const { error } = await supabase.rpc('mark_guideline_read', { p_item_id: itemId });
        if (error) return { ok: false, error: mapSupabaseError(error) };
        return { ok: true, data: undefined };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },

    markSectionRead: async (sectionId: string): Promise<ApiResult<void>> => {
      try {
        const { error } = await supabase.rpc('mark_section_read', { p_section_id: sectionId });
        if (error) return { ok: false, error: mapSupabaseError(error) };
        return { ok: true, data: undefined };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },

    getUnreadCount: async (sectionId?: string): Promise<ApiResult<number>> => {
      try {
        const { data, error } = await supabase.rpc('get_unread_guidelines_count', {
          p_section_id: sectionId ?? null,
        });
        if (error) return { ok: false, error: mapSupabaseError(error) };
        return { ok: true, data: data ?? 0 };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },
  },

  // ── AI Chat ──
  ai: {
    sendMessage: async (input: AIChatRequest): Promise<ApiResult<AIChatResponse>> => {
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: input,
        });

        if (error) return { ok: false, error: mapSupabaseError(error) };

        // Edge Function level errors
        if (data?.error) {
          const errorMap: Record<string, AppError> = {
            rate_limited: new AppError('AI_RATE_LIMITED', 'Rate limited', 429, data),
            agent_not_available: new AppError('AI_AGENT_DISABLED', 'Agent disabled', 403),
            message_too_long: new AppError('AI_MESSAGE_TOO_LONG', 'Message too long', 400),
            message_required: new AppError('VALIDATION_ERROR', 'Message required', 400),
            ai_error: new AppError('AI_SERVICE_UNAVAILABLE', 'AI error', 502),
            unauthorized: new AppError('AUTH_UNAUTHORIZED', 'Unauthorized', 401),
            not_an_artist: new AppError('AUTH_FORBIDDEN', 'Not an artist', 403),
          };
          const appError = errorMap[data.error] ??
            new AppError('UNKNOWN_ERROR', data.error);
          return { ok: false, error: appError };
        }

        return { ok: true, data: data as AIChatResponse };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },

    getRemainingMessages: async (): Promise<ApiResult<AIUsageInfo>> => {
      try {
        const { data, error } = await supabase.rpc('get_ai_remaining_messages');
        if (error) return { ok: false, error: mapSupabaseError(error) };
        if (data?.error) {
          const code = data.error === 'agent_disabled' ? 'AI_AGENT_DISABLED'
            : data.error === 'not_an_artist' ? 'AUTH_FORBIDDEN'
            : 'UNKNOWN_ERROR';
          return { ok: false, error: new AppError(code as any, data.error) };
        }
        return { ok: true, data: data as AIUsageInfo };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },

    getTodayMessages: (artistId: string) => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      return query<AIChatMessage[]>(async () => {
        const { data: sessions } = await supabase
          .from('ai_chat_sessions')
          .select('id')
          .eq('artist_id', artistId);

        const sessionIds = sessions?.map(s => s.id) ?? [];
        if (sessionIds.length === 0) return { data: [], error: null };

        return supabase
          .from('ai_chat_messages')
          .select('*')
          .in('session_id', sessionIds)
          .gte('created_at', todayStart.toISOString())
          .order('created_at');
      });
    },

    // Staff: admin views
    getArtistSessions: (artistId: string) => query<AIChatSessionAdmin[]>(() =>
      supabase.from('ai_chat_sessions_admin')
        .select('*')
        .eq('artist_id', artistId)
        .order('updated_at', { ascending: false })
    ),

    getSessionMessages: (sessionId: string) => query<AIChatMessage[]>(() =>
      supabase.from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at')
    ),

    getUsageStats: () => query<AIUsageStats[]>(() =>
      supabase.from('ai_usage_stats').select('*')
    ),

    getConfig: (artistId: string) => query<AIAgentConfig>(() =>
      supabase.from('ai_agent_configs').select('*').eq('artist_id', artistId).single()
    ),

    updateConfig: (artistId: string, config: Partial<AIAgentConfig>) => query<AIAgentConfig>(() =>
      supabase.from('ai_agent_configs')
        .update(config)
        .eq('artist_id', artistId)
        .select()
        .single()
    ),
  },

  // ── Notifications ──
  notifications: {
    getAll: () => query<Notification[]>(() =>
      supabase.from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
    ),

    markRead: (id: string) => query<Notification>(() =>
      supabase.from('notifications').update({ read: true }).eq('id', id).select().single()
    ),

    markAllRead: async (): Promise<ApiResult<void>> => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('read', false);
        if (error) return { ok: false, error: mapSupabaseError(error) };
        return { ok: true, data: undefined };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },

    getUnreadCount: async (): Promise<ApiResult<number>> => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('read', false);
        if (error) return { ok: false, error: mapSupabaseError(error) };
        return { ok: true, data: count ?? 0 };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },
  },

  // ── Storage helpers ──
  storage: {
    getPublicUrl: (bucket: string, path: string): string => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },

    upload: async (
      bucket: string,
      path: string,
      file: File | Blob,
      options?: { contentType?: string; upsert?: boolean }
    ): Promise<ApiResult<string>> => {
      try {
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: '3600',
          upsert: options?.upsert ?? false,
          contentType: options?.contentType,
        });
        if (error) return { ok: false, error: mapSupabaseError(error) };
        return { ok: true, data: path };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },

    delete: async (bucket: string, paths: string[]): Promise<ApiResult<void>> => {
      try {
        const { error } = await supabase.storage.from(bucket).remove(paths);
        if (error) return { ok: false, error: mapSupabaseError(error) };
        return { ok: true, data: undefined };
      } catch (err) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    },
  },
};
