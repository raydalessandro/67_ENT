'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getItems, getSections, createItem, markRead } from '@/lib/api/guidelines'
import { useAuth } from '@/hooks/use-auth'
import { GuidelineItem as GuidelineItemComponent } from '@/components/toolkit/guideline-item'
import type { GuidelineItem, GuidelineSection } from '@/types/models'
import type { CreateGuidelineInput } from '@/types/api'
import { toast } from 'sonner'

export default function ToolkitSectionPage() {
  const params = useParams()
  const slug = params.slug as string
  const { isStaff } = useAuth()
  const [items, setItems] = useState<GuidelineItem[]>([])
  const [section, setSection] = useState<GuidelineSection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    getSections().then(r => {
      if (r.ok) {
        const s = r.data.find(s => s.slug === slug)
        if (s) {
          setSection(s)
          getItems(s.id).then(ir => {
            if (ir.ok) setItems(ir.data)
            setIsLoading(false)
          })
        } else setIsLoading(false)
      } else setIsLoading(false)
    })
  }, [slug])

  const handleCreate = async () => {
    if (!section || !title.trim() || !content.trim()) return
    const input: CreateGuidelineInput = { section_id: section.id, title, content }
    const result = await createItem(input)
    if (result.ok) {
      setItems(prev => [result.data, ...prev])
      setShowCreate(false)
      setTitle('')
      setContent('')
      toast.success('Materiale creato')
    }
  }

  const handleRead = (itemId: string) => {
    markRead(itemId)
  }

  if (isLoading) return <div className="p-6"><div className="animate-pulse h-8 bg-[#1E1E30] rounded w-48 mb-4" />{[1,2,3].map(i => <div key={i} className="h-20 bg-[#13131F] rounded-xl animate-pulse mb-3" />)}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white mb-6">{section?.title ?? 'Sezione'}</h1>
      {section?.description && <p className="text-gray-400 mb-6">{section.description}</p>}

      {isStaff && (
        <button onClick={() => setShowCreate(true)} className="mb-6 px-4 py-2 bg-[#F5C518] text-black font-bold rounded-lg text-sm">+ Nuovo Materiale</button>
      )}

      {showCreate && (
        <div className="bg-[#13131F] border border-[#1E1E30] rounded-xl p-4 mb-6 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo" className="w-full bg-[#0F0F1A] border border-[#1E1E30] rounded-lg px-3 py-2 text-white" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenuto (Markdown)" rows={4} className="w-full bg-[#0F0F1A] border border-[#1E1E30] rounded-lg px-3 py-2 text-white" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-[#F5C518] text-black font-bold rounded-lg text-sm">Salva</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-[#1E1E30] text-gray-400 rounded-lg text-sm">Annulla</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => (
          <GuidelineItemComponent key={item.id} item={item} onRead={handleRead} />
        ))}
        {items.length === 0 && <p className="text-gray-500">Nessun materiale in questa sezione.</p>}
      </div>
    </div>
  )
}
