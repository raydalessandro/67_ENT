// ============================================================================
// App Constants
// ============================================================================

export const APP_NAME = '67 Hub';
export const LABEL_NAME = '67 ENTERTAINMENT';

// File upload limits
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_GUIDELINE_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
export const ACCEPTED_MEDIA_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

// AI Chat
export const AI_MAX_MESSAGE_LENGTH = 2000;
export const AI_DEFAULT_DAILY_LIMIT = 20;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// UI
export const TOAST_DURATION = 4000;
export const DEBOUNCE_MS = 300;
export const SKELETON_COUNT = 5;

// Video thumbnail
export const THUMBNAIL_WIDTH = 480;
export const THUMBNAIL_QUALITY = 0.8;
export const THUMBNAIL_SEEK_TIME = 1; // seconds
