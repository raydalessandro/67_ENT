'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RefreshCw, Share2, UserPlus, Save } from 'lucide-react'
// SPEC_GAP: CreateArtistInput is not exported from '@/types/api' — defining it locally from Artist model fields
import { ARTIST_COLOR_PRESETS } from '@/lib/constants'

export interface CreateArtistInput {
  name: string
  email: string
  password?: string
  color: string
  instagram_handle?: string
  tiktok_handle?: string
  youtube_handle?: string
  spotify_handle?: string
}

// SPEC_GAP: CreateArtistInput not defined in api.ts — inferring shape from context and Artist model
// Using a local schema that matches expected artist creation fields
const artistSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Minimo 8 caratteri').optional().or(z.literal('')),
  color: z.string().min(1, 'Seleziona un colore'),
  instagram_handle: z.string().optional(),
  tiktok_handle: z.string().optional(),
  youtube_handle: z.string().optional(),
  spotify_handle: z.string().optional(),
})

type ArtistFormValues = z.infer<typeof artistSchema>

interface ArtistFormProps {
  onSubmit: (input: CreateArtistInput) => Promise<void>
  isSubmitting?: boolean
  initialData?: Partial<CreateArtistInput>
  mode: 'create' | 'edit'
}

function generatePassword(length = 12): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function ArtistForm({ onSubmit, isSubmitting = false, initialData, mode }: ArtistFormProps) {
  const [generatedPassword, setGeneratedPassword] = useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ArtistFormValues>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      password: '',
      color: initialData?.color ?? ARTIST_COLOR_PRESETS[0],
      instagram_handle: initialData?.instagram_handle ?? '',
      tiktok_handle: initialData?.tiktok_handle ?? '',
      youtube_handle: initialData?.youtube_handle ?? '',
      spotify_handle: initialData?.spotify_handle ?? '',
    },
  })

  const selectedColor = watch('color')
  const watchedName = watch('name')
  const watchedEmail = watch('email')

  function handleGeneratePassword() {
    const pwd = generatePassword()
    setGeneratedPassword(pwd)
    setValue('password', pwd)
  }

  function handleWhatsAppShare() {
    const text = encodeURIComponent(
      `Ciao ${watchedName}! Ecco le tue credenziali per 67 Hub:\nEmail: ${watchedEmail}\nPassword: ${generatedPassword || '(generare una password prima)'}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  async function handleFormSubmit(values: ArtistFormValues) {
    await onSubmit(values as unknown as CreateArtistInput)
  }

  const inputClass =
    'rounded-lg bg-[#0F0F1A] border border-[#1E1E30] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#F5C518]/50 transition-colors w-full'
  const errorClass = 'text-xs text-red-400 mt-1'
  const labelClass = 'text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block'

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label className={labelClass}>Nome Artista</label>
        <input {...register('name')} placeholder="Nome dell'artista" className={inputClass} />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>Email</label>
        <input
          {...register('email')}
          type="email"
          placeholder="artista@esempio.com"
          className={inputClass}
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* Password */}
      {mode === 'create' && (
        <div>
          <label className={labelClass}>Password</label>
          <div className="flex gap-2">
            <input
              {...register('password')}
              type="text"
              placeholder="Inserisci o genera una password"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="flex items-center gap-1.5 rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-xs text-gray-300 hover:border-[#F5C518]/40 hover:text-[#F5C518] transition-colors whitespace-nowrap"
            >
              <RefreshCw size={13} />
              Auto-genera
            </button>
          </div>
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}

          {generatedPassword && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-gray-500 flex-1">
                Password generata:{' '}
                <span className="font-mono text-[#F5C518]">{generatedPassword}</span>
              </p>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                <Share2 size={13} />
                WhatsApp
              </button>
            </div>
          )}
        </div>
      )}

      {/* Color picker */}
      <div>
        <label className={labelClass}>Colore Artista</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {ARTIST_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              style={{ backgroundColor: color }}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none ${
                selectedColor === color
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#13131F] scale-110'
                  : ''
              }`}
              aria-label={`Seleziona colore ${color}`}
            />
          ))}
        </div>
        {errors.color && <p className={errorClass}>{errors.color.message}</p>}
      </div>

      {/* Social handles */}
      <div className="flex flex-col gap-3">
        <p className={labelClass}>Social Handles</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Instagram</label>
            <input
              {...register('instagram_handle')}
              placeholder="@handle"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">TikTok</label>
            <input
              {...register('tiktok_handle')}
              placeholder="@handle"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">YouTube</label>
            <input
              {...register('youtube_handle')}
              placeholder="@handle"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Spotify</label>
            <input
              {...register('spotify_handle')}
              placeholder="Nome artista su Spotify"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-[#F5C518] text-black text-sm font-bold px-5 py-2.5 hover:bg-[#e6b800] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mode === 'create' ? <UserPlus size={16} /> : <Save size={16} />}
          {isSubmitting
            ? 'Salvataggio…'
            : mode === 'create'
            ? 'Crea Artista'
            : 'Salva Modifiche'}
        </button>
      </div>
    </form>
  )
}
