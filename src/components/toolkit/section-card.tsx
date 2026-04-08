'use client'

import {
  Book,
  FileText,
  Lightbulb,
  Star,
  Heart,
  Zap,
  Target,
  Award,
  Bookmark,
  Calendar,
  Camera,
  Music,
  Palette,
  PenTool,
  Shield,
  TrendingUp,
  type LucideProps,
} from 'lucide-react'
import type { GuidelineSection } from '@/types/models'

type IconComponent = React.ComponentType<LucideProps>

const ICON_MAP: Record<string, IconComponent> = {
  Book,
  FileText,
  Lightbulb,
  Star,
  Heart,
  Zap,
  Target,
  Award,
  Bookmark,
  Calendar,
  Camera,
  Music,
  Palette,
  PenTool,
  Shield,
  TrendingUp,
}

interface SectionCardProps {
  section: GuidelineSection
  unreadCount?: number
  onClick: () => void
}

export function SectionCard({ section, unreadCount, onClick }: SectionCardProps) {
  const IconComponent: IconComponent = ICON_MAP[section.icon] ?? Book

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl bg-[#13131F] border border-[#1E1E30] p-5 flex items-start gap-4 hover:border-[#F5C518]/40 hover:bg-[#1a1a2e] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#F5C518]/30"
    >
      <div className="flex-shrink-0 mt-0.5 w-10 h-10 rounded-lg bg-[#0F0F1A] border border-[#1E1E30] flex items-center justify-center">
        <IconComponent size={20} className="text-[#F5C518]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white truncate">{section.title}</h3>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-[#F5C518] text-black text-[10px] font-black min-w-[18px] h-[18px] px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {section.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{section.description}</p>
        )}
      </div>
    </button>
  )
}
