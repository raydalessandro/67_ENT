'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { PostForm } from '@/components/posts/post-form'
import { MediaUploader } from '@/components/posts/media-uploader'
import { Skeleton } from '@/components/ui/skeleton'
import { createPost } from '@/lib/api/posts'
import { uploadMedia, deleteMedia } from '@/lib/api/media'
import { getArtists } from '@/lib/api/artists'
import type { Artist, PostMedia } from '@/types/models'

export default function NewPostPage() {
  const router = useRouter()
  const { isStaff, isLoading: authLoading } = useAuth()

  const [artists, setArtists] = useState<Artist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(true)

  const [createdPostId, setCreatedPostId] = useState<string | null>(null)
  const [media, setMedia] = useState<PostMedia[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect non-staff
  useEffect(() => {
    if (!authLoading && !isStaff) {
      router.replace('/')
    }
  }, [authLoading, isStaff, router])

  useEffect(() => {
    async function load() {
      const result = await getArtists()
      if (result.ok) {
        setArtists(result.data)
      }
      setArtistsLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(values: {
    artist_id: string
    title: string
    caption?: string
    hashtags?: string
    platforms: string[]
    scheduled_date?: string
  }) {
    setIsSubmitting(true)
    const result = await createPost({
      artist_id: values.artist_id,
      title: values.title,
      caption: values.caption,
      hashtags: values.hashtags,
      platforms: values.platforms as any,
      scheduled_date: values.scheduled_date || undefined,
    })

    if (!result.ok) {
      toast.error(result.error.userMessage)
      setIsSubmitting(false)
      return
    }

    toast.success('Post creato con successo')
    const postId = result.data.id
    setCreatedPostId(postId)
    setIsSubmitting(false)

    // Navigate after slight delay if no media to upload
    if (media.length === 0) {
      router.push(`/posts/${postId}`)
    }
  }

  async function handleUpload(file: File, order: number) {
    if (!createdPostId) {
      toast.error('Crea prima il post prima di caricare media')
      return
    }
    const result = await uploadMedia(createdPostId, file, order)
    if (result.ok) {
      setMedia((prev) => [...prev, result.data])
      toast.success('File caricato')
    } else {
      toast.error(result.error.userMessage)
    }
  }

  async function handleDeleteMedia(mediaId: string, filePath: string) {
    const result = await deleteMedia(mediaId, filePath)
    if (result.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== mediaId))
    } else {
      toast.error(result.error.userMessage)
    }
  }

  if (authLoading || artistsLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!isStaff) return null

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/calendar"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Calendario
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-white">Nuovo Post</h1>

        <div className="rounded-xl border border-[#1E1E30] bg-[#13131F] p-6">
          <PostForm
            artists={artists}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            mode="create"
          />
        </div>

        {/* Media uploader — available after post created */}
        {createdPostId && (
          <div className="mt-6 rounded-xl border border-[#1E1E30] bg-[#13131F] p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-300">Media</h2>
            <MediaUploader
              postId={createdPostId}
              media={media}
              onUpload={handleUpload}
              onDelete={handleDeleteMedia}
            />
            <button
              type="button"
              onClick={() => router.push(`/posts/${createdPostId}`)}
              className="mt-4 w-full rounded-lg bg-[#F5C518] py-2 text-sm font-semibold text-black hover:bg-[#F5C518]/90 transition-colors"
            >
              Vai al post
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
