'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { GuidelineItem as GuidelineItemType } from '@/types/models'

interface GuidelineItemProps {
  item: GuidelineItemType
  onRead: (id: string) => void
}

const TYPE_LABELS: Record<string, string> = {
  permanent: 'Permanente',
  campaign: 'Campagna',
  update: 'Aggiornamento',
}

const TYPE_COLORS: Record<string, string> = {
  permanent: 'bg-blue-900/40 text-blue-300 border-blue-700/30',
  campaign: 'bg-amber-900/40 text-amber-300 border-amber-700/30',
  update: 'bg-green-900/40 text-green-300 border-green-700/30',
}

function PriorityStars({ priority }: { priority: number }) {
  const clamped = Math.max(1, Math.min(5, priority))
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill={i < clamped ? '#F5C518' : '#2a2a40'}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.1 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z" />
        </svg>
      ))}
    </span>
  )
}

export function GuidelineItem({ item, onRead }: GuidelineItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [hasRead, setHasRead] = useState(item.is_read ?? false)

  function handleToggle() {
    const willExpand = !expanded
    setExpanded(willExpand)
    if (willExpand && !hasRead) {
      setHasRead(true)
      onRead(item.id)
    }
  }

  const typeBadgeClass =
    TYPE_COLORS[item.item_type] ?? 'bg-gray-800/40 text-gray-300 border-gray-600/30'
  const typeLabel = TYPE_LABELS[item.item_type] ?? item.item_type

  return (
    <div className="rounded-lg bg-[#13131F] border border-[#1E1E30] overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#1a1a2e] transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#F5C518]/20"
      >
        {!hasRead && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#F5C518]" aria-label="Non letto" />
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{item.title}</span>
            <span
              className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 ${typeBadgeClass}`}
            >
              {typeLabel}
            </span>
          </div>
          <PriorityStars priority={item.priority} />
        </div>

        <span className="flex-shrink-0 text-gray-500">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#1E1E30]">
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
          {(item.valid_from || item.valid_until) && (
            <p className="mt-3 text-xs text-gray-500">
              {item.valid_from && <>Dal {new Date(item.valid_from).toLocaleDateString('it-IT')}</>}
              {item.valid_from && item.valid_until && ' '}
              {item.valid_until && <>al {new Date(item.valid_until).toLocaleDateString('it-IT')}</>}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
