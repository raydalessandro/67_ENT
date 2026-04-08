'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { SectionCard } from '@/components/toolkit/section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { getSections, createSection, getUnreadCount } from '@/lib/api/guidelines'
import type { GuidelineSection } from '@/types/models'
import { SECTION_ICONS } from '@/lib/constants'

export default function ToolkitPage() {
  const router = useRouter()
  const { isStaff } = useAuth()

  const [sections, setSections] = useState<GuidelineSection[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newIcon, setNewIcon] = useState('Book')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const result = await getSections()
      if (!result.ok) {
        setError(result.error.userMessage)
        setIsLoading(false)
        return
      }
      setSections(result.data)

      // Load unread counts per section
      const counts: Record<string, number> = {}
      await Promise.all(
        result.data.map(async (section) => {
          const countResult = await getUnreadCount(section.id)
          if (countResult.ok) {
            counts[section.id] = countResult.data
          }
        })
      )
      setUnreadCounts(counts)
      setIsLoading(false)
    }
    load()
  }, [])

  async function handleCreate() {
    if (!newTitle.trim()) {
      toast.error('Il titolo è obbligatorio')
      return
    }
    setIsCreating(true)
    const result = await createSection({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      icon: newIcon,
    })
    if (result.ok) {
      setSections((prev) => [...prev, result.data])
      setShowCreateDialog(false)
      setNewTitle('')
      setNewDescription('')
      setNewIcon('Book')
      toast.success('Sezione creata')
    } else {
      toast.error(result.error.userMessage)
    }
    setIsCreating(false)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Toolkit</h1>
          {isStaff && (
            <button
              type="button"
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#F5C518] px-3 py-1.5 text-sm font-semibold text-black hover:bg-[#F5C518]/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuova sezione
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {sections.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-500">Nessuna sezione disponibile</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              unreadCount={unreadCounts[section.id]}
              onClick={() => router.push(`/toolkit/${section.slug}`)}
            />
          ))}
        </div>
      </div>

      {/* Create section dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-[#1E1E30] bg-[#13131F] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Nuova sezione</h3>
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="text-gray-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Titolo *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nome della sezione..."
                  className="w-full rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#F5C518]/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Descrizione</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descrizione breve..."
                  rows={2}
                  className="w-full rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#F5C518]/60 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Icona</label>
                <select
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-full rounded-lg border border-[#1E1E30] bg-[#0F0F1A] px-3 py-2 text-sm text-white focus:border-[#F5C518]/60 focus:outline-none"
                >
                  {SECTION_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="rounded-lg border border-[#1E1E30] bg-transparent px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="rounded-lg bg-[#F5C518] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F5C518]/90 disabled:opacity-50 transition-colors"
                >
                  {isCreating ? 'Creazione...' : 'Crea'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
