'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { getArtists, createArtist, deactivateArtist, resetPassword } from '@/lib/api/artists'
import { ArtistTable } from '@/components/admin/artist-table'
import { ArtistForm } from '@/components/admin/artist-form'
import type { Artist } from '@/types/models'
import { toast } from 'sonner'

export default function AdminPage() {
  const { isAdmin, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [artists, setArtists] = useState<Artist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/')
  }, [authLoading, isAdmin, router])

  const loadArtists = async () => {
    const result = await getArtists()
    if (result.ok) setArtists(result.data)
    setIsLoading(false)
  }

  useEffect(() => { loadArtists() }, [])

  const handleCreate = async (input: any) => {
    setIsSubmitting(true)
    const result = await createArtist(input)
    if (result.ok) {
      toast.success(`Artista ${result.data.name} creato`)
      setShowCreate(false)
      loadArtists()
    } else {
      toast.error(result.error.userMessage)
    }
    setIsSubmitting(false)
  }

  const handleDeactivate = async (id: string) => {
    const result = await deactivateArtist(id)
    if (result.ok) {
      toast.success('Artista disattivato')
      loadArtists()
    } else {
      toast.error(result.error.userMessage)
    }
  }

  const handleResetPassword = async (userId: string) => {
    const newPw = Math.random().toString(36).slice(-12)
    const result = await resetPassword(userId, newPw)
    if (result.ok) {
      toast.success(`Nuova password: ${newPw}`)
    } else {
      toast.error(result.error.userMessage)
    }
  }

  if (authLoading || isLoading) {
    return <div className="p-6"><div className="animate-pulse h-8 bg-[#1E1E30] rounded w-48 mb-6" /><div className="h-64 bg-[#13131F] rounded-xl animate-pulse" /></div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Gestione Artisti</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#F5C518] text-black font-bold rounded-lg text-sm">+ Nuovo Artista</button>
      </div>

      {showCreate && (
        <div className="bg-[#13131F] border border-[#1E1E30] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Nuovo Artista</h2>
          <ArtistForm onSubmit={handleCreate} isSubmitting={isSubmitting} mode="create" />
          <button onClick={() => setShowCreate(false)} className="mt-3 text-gray-400 text-sm hover:text-white">Annulla</button>
        </div>
      )}

      <ArtistTable
        artists={artists}
        onEdit={() => {}}
        onDeactivate={handleDeactivate}
        onToggleActive={() => {}}
        onConfigureAi={(id) => router.push(`/ai-chat/config/${id}`)}
        onResetPassword={handleResetPassword}
      />
    </div>
  )
}
