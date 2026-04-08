'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { getArtists } from '@/lib/api/artists'
import { getAiConfigs } from '@/lib/api/ai-config'
import type { Artist, AiAgentConfig } from '@/types/models'

export default function AiConfigListPage() {
  const { isStaff, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [artists, setArtists] = useState<Artist[]>([])
  const [configs, setConfigs] = useState<AiAgentConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isStaff) router.replace('/')
  }, [authLoading, isStaff, router])

  useEffect(() => {
    Promise.all([getArtists(), getAiConfigs()]).then(([ar, cr]) => {
      if (ar.ok) setArtists(ar.data.filter(a => a.is_active))
      if (cr.ok) setConfigs(cr.data)
      setIsLoading(false)
    })
  }, [])

  if (authLoading || isLoading) {
    return <div className="p-6"><div className="animate-pulse h-8 bg-[#1E1E30] rounded w-48 mb-6" />{[1,2,3].map(i => <div key={i} className="h-16 bg-[#13131F] rounded-xl animate-pulse mb-3" />)}</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white mb-6">Configurazione AI</h1>
      <div className="space-y-3">
        {artists.map(artist => {
          const config = configs.find(c => c.artist_id === artist.id)
          return (
            <button
              key={artist.id}
              onClick={() => router.push(`/ai-chat/config/${artist.id}`)}
              className="w-full bg-[#13131F] border border-[#1E1E30] rounded-xl p-4 flex items-center justify-between hover:border-[#F5C518]/50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: artist.color }} />
                <span className="font-bold text-white">{artist.name}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${config?.is_enabled ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                {config?.is_enabled ? 'Abilitato' : 'Disabilitato'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
