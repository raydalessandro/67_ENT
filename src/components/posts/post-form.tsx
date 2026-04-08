'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Artist, Post, PostPlatform } from '@/types/models'
import { PLATFORMS } from '@/lib/constants'
import { Button } from '@/components/ui/button'

const postSchema = z.object({
  artist_id: z.string().min(1, 'Seleziona un artista'),
  title: z.string().min(1, 'Il titolo è obbligatorio').max(200, 'Titolo troppo lungo'),
  caption: z.string().max(2200, 'Caption troppo lunga').optional(),
  hashtags: z.string().max(500, 'Hashtag troppo lunghi').optional(),
  platforms: z.array(z.string()).min(1, 'Seleziona almeno una piattaforma'),
  scheduled_date: z.string().optional(),
})

type PostFormValues = z.infer<typeof postSchema>

interface PostFormProps {
  artists: Artist[]
  onSubmit: (values: PostFormValues) => Promise<void>
  isSubmitting?: boolean
  initialData?: Partial<Post>
  mode: 'create' | 'edit'
}

export function PostForm({ artists, onSubmit, isSubmitting, initialData, mode }: PostFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      artist_id: initialData?.artist_id ?? '',
      title: initialData?.title ?? '',
      caption: initialData?.caption ?? '',
      hashtags: initialData?.hashtags ?? '',
      platforms: initialData?.platforms ?? [],
      scheduled_date: initialData?.scheduled_date
        ? initialData.scheduled_date.slice(0, 16)
        : '',
    },
  })

  const selectedPlatforms = watch('platforms') as PostPlatform[]

  function togglePlatform(value: PostPlatform) {
    const current = selectedPlatforms ?? []
    if (current.includes(value)) {
      setValue(
        'platforms',
        current.filter((p) => p !== value),
        { shouldValidate: true }
      )
    } else {
      setValue('platforms', [...current, value], { shouldValidate: true })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Artist selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-300">Artista</label>
        <select
          {...register('artist_id')}
          disabled={mode === 'edit'}
          className="w-full rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white focus:border-[#F5C518]/60 focus:outline-none disabled:opacity-50"
        >
          <option value="">Seleziona artista...</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {errors.artist_id && (
          <p className="text-xs text-red-400">{errors.artist_id.message}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-300">Titolo</label>
        <input
          {...register('title')}
          type="text"
          placeholder="Titolo del post..."
          className="w-full rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#F5C518]/60 focus:outline-none"
        />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title.message}</p>
        )}
      </div>

      {/* Caption */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-300">Caption</label>
        <textarea
          {...register('caption')}
          rows={4}
          placeholder="Testo del post..."
          className="w-full rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#F5C518]/60 focus:outline-none resize-none"
        />
        {errors.caption && (
          <p className="text-xs text-red-400">{errors.caption.message}</p>
        )}
      </div>

      {/* Hashtags */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-300">Hashtag</label>
        <textarea
          {...register('hashtags')}
          rows={2}
          placeholder="#hashtag1 #hashtag2 ..."
          className="w-full rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#F5C518]/60 focus:outline-none resize-none"
        />
        {errors.hashtags && (
          <p className="text-xs text-red-400">{errors.hashtags.message}</p>
        )}
      </div>

      {/* Platforms */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Piattaforme</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => {
            const selected = selectedPlatforms?.includes(platform.value as PostPlatform)
            return (
              <button
                key={platform.value}
                type="button"
                onClick={() => togglePlatform(platform.value as PostPlatform)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-[#F5C518] text-black'
                    : 'border border-[#1E1E30] bg-[#0F0F1A] text-gray-400 hover:border-[#F5C518]/40'
                }`}
              >
                {platform.label}
              </button>
            )
          })}
        </div>
        {errors.platforms && (
          <p className="text-xs text-red-400">{errors.platforms.message}</p>
        )}
      </div>

      {/* Scheduled date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-300">Data programmata</label>
        <input
          {...register('scheduled_date')}
          type="datetime-local"
          className="w-full rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white focus:border-[#F5C518]/60 focus:outline-none [color-scheme:dark]"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#F5C518] text-black hover:bg-[#F5C518]/90 disabled:opacity-50"
      >
        {isSubmitting
          ? 'Salvataggio...'
          : mode === 'create'
          ? 'Crea Post'
          : 'Salva Modifiche'}
      </Button>
    </form>
  )
}
