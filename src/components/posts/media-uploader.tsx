'use client'

import { useRef, useState } from 'react'
import type { PostMedia } from '@/types/models'

interface MediaUploaderProps {
  postId: string
  media: PostMedia[]
  onUpload: (file: File, order: number) => Promise<void>
  onDelete: (mediaId: string, filePath: string) => Promise<void>
  disabled?: boolean
}

export function MediaUploader({ postId: _postId, media, onUpload, onDelete, disabled }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || disabled) return
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const order = media.length + i
        await onUpload(file, order)
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  async function handleDeleteMedia(item: PostMedia) {
    if (disabled) return
    setDeletingId(item.id)
    try {
      // Extract relative path from file_url
      const url = new URL(item.file_url)
      const path = url.pathname.split('/post-media/').pop() ?? item.file_url
      await onDelete(item.id, path)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-[#F5C518] bg-[#F5C518]/5'
            : 'border-[#1E1E30] bg-[#0F0F1A] hover:border-[#F5C518]/40'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
            <p className="text-xs text-gray-500">Caricamento...</p>
          </div>
        ) : (
          <>
            <svg
              className="h-8 w-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              Trascina file qui o <span className="text-[#F5C518]">clicca per caricare</span>
            </p>
            <p className="text-xs text-gray-600">Immagini e video supportati</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
      </div>

      {/* Media thumbnails */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {media.map((item) => (
            <div key={item.id} className="group relative aspect-square">
              {item.file_type === 'video' ? (
                <video
                  src={item.file_url}
                  className="h-full w-full rounded-lg object-cover"
                  muted
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail_url ?? item.file_url}
                  alt="Media"
                  className="h-full w-full rounded-lg object-cover"
                />
              )}

              {/* Delete button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDeleteMedia(item)}
                  disabled={deletingId === item.id}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:opacity-50"
                  title="Elimina"
                >
                  {deletingId === item.id ? (
                    <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  ) : (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              )}

              {/* Video indicator */}
              {item.file_type === 'video' && (
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[10px] text-white">
                  VIDEO
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
