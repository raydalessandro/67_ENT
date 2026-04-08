'use client'

import { useUiStore } from '@/stores/ui-store'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { PushBanner } from '@/components/layout/push-banner'
import { WifiOff } from 'lucide-react'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const isOffline = useUiStore((s) => s.isOffline)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <PushBanner />

      {isOffline && (
        <div className="flex items-center justify-center gap-2 bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-sm text-destructive">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Sei offline. Alcune funzionalita potrebbero non essere disponibili.</span>
        </div>
      )}

      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
