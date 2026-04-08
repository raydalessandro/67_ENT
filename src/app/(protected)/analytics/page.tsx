'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { getArtists } from '@/lib/api/artists'
import type { Artist } from '@/types/models'

export default function AnalyticsPage() {
  const { isStaff, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [artists, setArtists] = useState<Artist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isStaff) router.replace('/')
  }, [authLoading, isStaff, router])

  useEffect(() => {
    getArtists().then(result => {
      if (result.ok) setArtists(result.data.filter(a => a.is_active))
      setIsLoading(false)
    })
  }, [])

  if (authLoading || isLoading) {
    return <div className="p-6"><div className="animate-pulse h-8 bg-[#1E1E30] rounded w-48 mb-6" /><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-[#13131F] rounded-xl animate-pulse" />)}</div></div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white mb-6">Analytics Instagram</h1>
      <p className="text-gray-400 mb-6">Seleziona un artista per visualizzare le analytics.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {artists.map(artist => (
          <button
            key={artist.id}
            onClick={() => router.push(`/analytics/${artist.id}`)}
            className="bg-[#13131F] border border-[#1E1E30] rounded-xl p-6 text-left hover:border-[#F5C518]/50 hover:shadow-lg hover:shadow-[#F5C518]/10 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: artist.color }} />
              <span className="font-bold text-white">{artist.name}</span>
            </div>
            {artist.instagram_handle && (
              <p className="text-sm text-gray-400">@{artist.instagram_handle}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
