'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Home, Calendar, Wrench, BarChart2, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

function useBottomNavItems(): NavItem[] {
  const { user, isStaff } = useAuthStore()

  if (!user) return []

  const items: NavItem[] = [
    { href: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { href: '/calendar', label: 'Calendario', icon: <Calendar className="h-5 w-5" /> },
    { href: '/toolkit', label: 'Toolkit', icon: <Wrench className="h-5 w-5" /> },
  ]

  if (isStaff) {
    items.push({
      href: '/analytics',
      label: 'Analytics',
      icon: <BarChart2 className="h-5 w-5" />,
    })
  }

  if (user.role === 'artist') {
    // SPEC_GAP: feature flag for AI Chat not defined in store; show for all artists
    items.push({ href: '/ai-chat', label: 'AI Chat', icon: <Bot className="h-5 w-5" /> })
  }

  return items
}

export function BottomNav() {
  const pathname = usePathname()
  const items = useBottomNavItems()

  if (items.length === 0) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card">
      <ul className="flex h-16 items-stretch">
        {items.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-xs transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.icon}
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
