// ============================================================================
// Media Gallery — images & video with thumbnails
// ============================================================================

import { useState } from 'react';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { PostMedia } from '@/types/models';

interface Props {
  media: PostMedia[];
}

export function MediaGallery({ media }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (media.length === 0) return null;

  const current = media[activeIndex];
  const isVideo = current?.mime_type?.startsWith('video/');

  const getUrl = (path: string) => api.storage.getPublicUrl('post-media', path);

  return (
    <>
      {/* Main view */}
      <div className="relative rounded-xl overflow-hidden bg-gray-900">
        {isVideo ? (
          <VideoWithThumbnail media={current} getUrl={getUrl} />
        ) : (
          <button
            onClick={() => setLightboxOpen(true)}
            className="w-full"
          >
            <img
              src={getUrl(current.storage_path)}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-auto max-h-96 object-contain"
            />
          </button>
        )}

        {/* Pagination arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((i) => (i > 0 ? i - 1 : media.length - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                         bg-black/50 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveIndex((i) => (i < media.length - 1 ? i + 1 : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                         bg-black/50 flex items-center justify-center text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {media.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === activeIndex ? 'bg-white w-4' : 'bg-white/40',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      {media.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                i === activeIndex ? 'border-indigo-500' : 'border-transparent',
              )}
            >
              <img
                src={getUrl(m.thumbnail_path ?? m.storage_path)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && !isVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={getUrl(current.storage_path)}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}

// ── Video with thumbnail poster ──

function VideoWithThumbnail({
  media,
  getUrl,
}: {
  media: PostMedia;
  getUrl: (path: string) => string;
}) {
  const [showVideo, setShowVideo] = useState(false);
  const posterUrl = media.thumbnail_path ? getUrl(media.thumbnail_path) : undefined;

  if (!showVideo && posterUrl) {
    return (
      <button
        onClick={() => setShowVideo(true)}
        className="relative w-full"
      >
        <img
          src={posterUrl}
          alt="Video thumbnail"
          className="w-full h-auto max-h-96 object-contain"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
            <Play className="w-7 h-7 text-white ml-1" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <video
      src={getUrl(media.storage_path)}
      poster={posterUrl}
      controls
      playsInline
      preload="metadata"
      controlsList="nodownload"
      className="w-full h-auto max-h-96"
      autoPlay={showVideo}
    />
  );
}
