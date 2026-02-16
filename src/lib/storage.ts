// ============================================================================
// Video Thumbnail Generation (client-side, iOS/Android compatible)
// ============================================================================

import { THUMBNAIL_WIDTH, THUMBNAIL_QUALITY, THUMBNAIL_SEEK_TIME } from '@/config/constants';

export async function generateVideoThumbnail(
  file: File,
  seekTime: number = THUMBNAIL_SEEK_TIME,
  width: number = THUMBNAIL_WIDTH,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');

    // Critical for iOS
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    // Timeout fallback
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Thumbnail generation timeout'));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(video.src);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const seekTo = Math.min(seekTime, video.duration * 0.25 || 0);
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const ratio = video.videoHeight / video.videoWidth;
        canvas.width = width;
        canvas.height = Math.round(width * ratio);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              reject(new Error('Generated empty thumbnail'));
            }
          },
          'image/jpeg',
          THUMBNAIL_QUALITY,
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video for thumbnail'));
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
}

/** Safe wrapper — returns null instead of throwing */
export async function generateThumbnailSafe(file: File): Promise<Blob | null> {
  try {
    return await generateVideoThumbnail(file);
  } catch (err) {
    console.warn('Thumbnail generation failed:', err);
    return null;
  }
}
