// ============================================================================
// Enums & Constants
// ============================================================================

export const USER_ROLES = ['admin', 'manager', 'artist'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const POST_STATUSES = ['draft', 'in_review', 'approved', 'rejected', 'published'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_PLATFORMS = [
  'instagram_feed', 'instagram_story', 'instagram_reel',
  'tiktok', 'youtube', 'youtube_shorts',
  'facebook', 'twitter', 'spotify',
] as const;
export type PostPlatform = (typeof POST_PLATFORMS)[number];

export const NOTIFICATION_TYPES = [
  'post_review', 'post_approved', 'post_rejected',
  'post_published', 'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const GUIDELINE_ITEM_TYPES = ['permanent', 'campaign'] as const;
export type GuidelineItemType = (typeof GUIDELINE_ITEM_TYPES)[number];

export const GUIDELINE_PRIORITIES = [0, 1, 2] as const;
export type GuidelinePriority = (typeof GUIDELINE_PRIORITIES)[number];

export const AI_CHAT_ROLES = ['user', 'assistant'] as const;
export type AIChatRole = (typeof AI_CHAT_ROLES)[number];

export const THUMBNAIL_STATUSES = ['pending', 'processing', 'ready', 'failed'] as const;
export type ThumbnailStatus = (typeof THUMBNAIL_STATUSES)[number];

// Display configs
export const PLATFORM_CONFIG: Record<PostPlatform, { label: string; icon: string; color: string }> = {
  instagram_feed:  { label: 'Instagram Feed',  icon: 'instagram', color: '#E4405F' },
  instagram_story: { label: 'Instagram Story', icon: 'instagram', color: '#E4405F' },
  instagram_reel:  { label: 'Instagram Reel',  icon: 'instagram', color: '#E4405F' },
  tiktok:          { label: 'TikTok',          icon: 'music',     color: '#000000' },
  youtube:         { label: 'YouTube',          icon: 'youtube',   color: '#FF0000' },
  youtube_shorts:  { label: 'YouTube Shorts',   icon: 'youtube',   color: '#FF0000' },
  facebook:        { label: 'Facebook',         icon: 'facebook',  color: '#1877F2' },
  twitter:         { label: 'X / Twitter',      icon: 'twitter',   color: '#1DA1F2' },
  spotify:         { label: 'Spotify',          icon: 'music',     color: '#1DB954' },
};

export const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; bgColor: string }> = {
  draft:      { label: 'Bozza',        color: '#6B7280', bgColor: '#F3F4F6' },
  in_review:  { label: 'In Revisione', color: '#F59E0B', bgColor: '#FEF3C7' },
  approved:   { label: 'Approvato',    color: '#10B981', bgColor: '#D1FAE5' },
  rejected:   { label: 'Rifiutato',    color: '#EF4444', bgColor: '#FEE2E2' },
  published:  { label: 'Pubblicato',   color: '#6366F1', bgColor: '#E0E7FF' },
};

export const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: 'Normale',    color: '#6B7280' },
  1: { label: 'Importante', color: '#F59E0B' },
  2: { label: 'Urgente',    color: '#EF4444' },
};
