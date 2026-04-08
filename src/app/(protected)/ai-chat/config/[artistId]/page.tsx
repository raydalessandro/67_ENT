'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { getAiConfig, updateAiConfig } from '@/lib/api/ai-config'
import { AiConfigForm } from '@/components/ai/config-form'
import type { AiAgentConfig } from '@/types/models'
import type { UpdateAiConfigInput } from '@/types/api'
import { toast } from 'sonner'

export default function AiConfigPage() {
  const params = useParams()
  const router = useRouter()
  const artistId = params.artistId as string
  const { isStaff, isLoading: authLoading } = useAuth()
  const [config, setConfig] = useState<AiAgentConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !isStaff) router.replace('/')
  }, [authLoading, isStaff, router])

  useEffect(() => {
    getAiConfig(artistId).then(r => {
      if (r.ok) setConfig(r.data)
      setIsLoading(false)
    })
  }, [artistId])

  const handleSave = async (input: UpdateAiConfigInput) => {
    setIsSaving(true)
    const result = await updateAiConfig(artistId, input)
    if (result.ok) {
      setConfig(result.data)
      toast.success('Configurazione salvata')
    } else {
      toast.error(result.error.userMessage)
    }
    setIsSaving(false)
  }

  if (authLoading || isLoading) {
    return <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-[#13131F] rounded-xl animate-pulse" />)}</div>
  }

  if (!config) return <div className="p-6 text-gray-400">Configurazione non trovata.</div>

  return (
    <div className="p-6">
      <button onClick={() => router.push('/ai-chat/config')} className="text-gray-400 hover:text-white mb-4 block">← Indietro</button>
      <h1 className="text-2xl font-black text-white mb-6">Configurazione AI</h1>
      <AiConfigForm config={config} onSave={handleSave} isSaving={isSaving} />
    </div>
  )
}
