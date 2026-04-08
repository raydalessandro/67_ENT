'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  PlusSquare,
  BookOpen,
  BarChart2,
  Settings2,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface NavCard {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}

const STAFF_CARDS: NavCard[] = [
  {
    href: '/calendar',
    icon: <Calendar className="h-7 w-7 text-[#F5C518]" />,
    title: 'Calendario',
    description: 'Visualizza e gestisci i post programmati',
  },
  {
    href: '/posts/new',
    icon: <PlusSquare className="h-7 w-7 text-[#F5C518]" />,
    title: 'Nuovo Post',
    description: 'Crea un nuovo contenuto per gli artisti',
  },
  {
    href: '/toolkit',
    icon: <BookOpen className="h-7 w-7 text-[#F5C518]" />,
    title: 'Toolkit',
    description: 'Linee guida e risorse operative',
  },
  {
    href: '/analytics',
    icon: <BarChart2 className="h-7 w-7 text-[#F5C518]" />,
    title: 'Analytics',
    description: 'Statistiche Instagram per artista',
  },
  {
    href: '/ai-chat/config',
    icon: <Settings2 className="h-7 w-7 text-[#F5C518]" />,
    title: 'Config AI',
    description: 'Configura gli agenti AI degli artisti',
  },
  {
    href: '/admin',
    icon: <ShieldCheck className="h-7 w-7 text-[#F5C518]" />,
    title: 'Admin',
    description: 'Gestione artisti e account',
  },
]

const ARTIST_CARDS: NavCard[] = [
  {
    href: '/calendar',
    icon: <Calendar className="h-7 w-7 text-[#F5C518]" />,
    title: 'Calendario',
    description: 'Visualizza i tuoi post programmati',
  },
  {
    href: '/toolkit',
    icon: <BookOpen className="h-7 w-7 text-[#F5C518]" />,
    title: 'Toolkit',
    description: 'Linee guida e risorse operative',
  },
  {
    href: '/ai-chat',
    icon: <MessageCircle className="h-7 w-7 text-[#F5C518]" />,
    title: 'AI Chat',
    description: 'Il tuo assistente AI personale',
  },
]

export default function HomePage() {
  const router = useRouter()
  const { user, artist, isStaff, isLoading } = useAuth()

  // Artists land directly on their calendar
  useEffect(() => {
    if (!isLoading && !isStaff && user) {
      router.replace('/calendar')
    }
  }, [isLoading, isStaff, user, router])

  const cards = isStaff ? STAFF_CARDS : ARTIST_CARDS

  const greeting = isStaff
    ? `Benvenuto, ${user?.display_name ?? 'Staff'}`
    : `Benvenuto, ${artist?.name ?? user?.display_name ?? 'Artista'}`

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">{greeting}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isStaff ? 'Pannello di gestione 67 Hub' : 'Il tuo spazio creativo'}
          </p>
        </div>

        {/* Nav cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex items-start gap-4 rounded-xl border border-[#1E1E30] bg-[#13131F] p-5 transition-colors hover:border-[#F5C518]/40 hover:bg-[#1a1a2e]"
            >
              <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#1E1E30] bg-[#0F0F1A]">
                {card.icon}
              </div>
              <div>
                <h2 className="text-base font-semibold text-white group-hover:text-[#F5C518] transition-colors">
                  {card.title}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
