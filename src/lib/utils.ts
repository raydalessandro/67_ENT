// ============================================================================
// Pure Utility Functions
// ============================================================================

import { ACCEPTED_MEDIA_TYPES, MAX_FILE_SIZE } from '@/config/constants';

/** Format date to Italian locale */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

/** Format time (HH:MM) */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format relative time (e.g., "2 ore fa") */
export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'ora';
  if (diffMin < 60) return `${diffMin}min fa`;
  if (diffH < 24) return `${diffH}h fa`;
  if (diffD < 7) return `${diffD}gg fa`;
  return formatDate(date, { year: undefined });
}

/** Format duration (seconds → M:SS) */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format file size */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Sanitize filename for storage */
export function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase();
}

/** Validate file for upload */
export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File troppo grande (${formatFileSize(file.size)}). Max ${formatFileSize(MAX_FILE_SIZE)}.`;
  }
  if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
    return `Tipo file non supportato: ${file.type}`;
  }
  return null;
}

/** Check if file is a video */
export function isVideoFile(file: File | { mime_type: string }): boolean {
  const type = 'type' in file ? file.type : file.mime_type;
  return type.startsWith('video/');
}

/** Get next midnight (UTC) */
export function getNextMidnightUTC(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}

/** Get today start (local time) */
export function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Debounce */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** clsx-like classname joiner */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
