'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Menu,
  Calendar,
  Wrench,
  BarChart2,
  Bot,
  Settings,
  Users,
  LogOut,
} from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  artist: 'Artista',
}

interface NavLink {
  href: string
  label: string
  icon: React.ReactNode
}

function useNavLinks(): NavLink[] {
  const { user, isStaff } = useAuthStore()

  if (!user) return []

  const links: NavLink[] = [
    { href: '/calendar', label: 'Calendario', icon: <Calendar className="h-4 w-4" /> },
    { href: '/toolkit', label: 'Toolkit', icon: <Wrench className="h-4 w-4" /> },
  ]

  if (isStaff) {
    links.push(
      { href: '/analytics', label: 'Analytics', icon: <BarChart2 className="h-4 w-4" /> },
      { href: '/ai-config', label: 'AI Config', icon: <Bot className="h-4 w-4" /> },
      { href: '/admin', label: 'Admin', icon: <Settings className="h-4 w-4" /> },
    )
  }

  if (user.role === 'artist') {
    // SPEC_GAP: feature flag for AI Chat not defined in store; show for all artists
    links.push({ href: '/ai-chat', label: 'AI Chat', icon: <Bot className="h-4 w-4" /> })
  }

  return links
}

function NavLinks({ links, onNavigate }: { links: NavLink[]; onNavigate?: () => void }) {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
        >
          {link.icon}
          {link.label}
        </Link>
      ))}
    </>
  )
}

export function Header() {
  const { user, isStaff, isAdmin, logout } = useAuth()
  const links = useNavLinks()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const initials = user.display_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const roleLabel = ROLE_LABELS[user.role] ?? user.role

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 font-bold text-lg">
          <span className="text-primary">67</span>
          <span className="text-foreground">Hub</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLinks links={links} />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm max-w-[120px] truncate">
                  {user.display_name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span className="font-medium truncate">{user.display_name}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                <Badge variant="secondary" className="w-fit text-xs mt-1">
                  {roleLabel}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Impostazioni
                  </Link>
                </DropdownMenuItem>
              )}
              {isStaff && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/artists" className="flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4" />
                    Artisti
                  </Link>
                </DropdownMenuItem>
              )}
              {(isAdmin || isStaff) && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-card border-border">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <span className="text-primary font-bold">67</span>
                  <span className="font-bold"> Hub</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6">
                <NavLinks links={links} onNavigate={() => setMobileOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
