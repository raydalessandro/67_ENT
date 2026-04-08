import type { PostPlatform, PostStatus } from '@/types/models'

export const PLATFORMS: { value: PostPlatform; label: string }[] = [
  { value: 'instagram_feed', label: 'Instagram Feed' },
  { value: 'instagram_story', label: 'Instagram Story' },
  { value: 'instagram_reel', label: 'Instagram Reel' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'spotify', label: 'Spotify' },
]

export const POST_STATUSES: { value: PostStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Bozza', color: 'gray' },
  { value: 'in_review', label: 'In revisione', color: 'yellow' },
  { value: 'approved', label: 'Approvato', color: 'green' },
  { value: 'rejected', label: 'Rifiutato', color: 'red' },
  { value: 'published', label: 'Pubblicato', color: 'blue' },
]

export const STATUS_COLORS: Record<PostStatus, string> = {
  draft: 'gray',
  in_review: 'yellow',
  approved: 'green',
  rejected: 'red',
  published: 'blue',
}

export const SECTION_ICONS = [
  'Book', 'FileText', 'Lightbulb', 'Star', 'Heart', 'Zap',
  'Target', 'Award', 'Bookmark', 'Calendar', 'Camera', 'Music',
  'Palette', 'PenTool', 'Shield', 'TrendingUp',
]

export const ARTIST_COLOR_PRESETS = [
  '#F5C518', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
]

export const TOAST_DURATION = 4000
export const CACHE_TTL = 300_000       // 5min in ms
export const RATE_LIMIT_REFRESH = 300_000  // 5min in ms
export const DAILY_MESSAGE_DEFAULT = 20
