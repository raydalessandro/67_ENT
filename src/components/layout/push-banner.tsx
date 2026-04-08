'use client'

import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePush } from '@/hooks/use-push'

export function PushBanner(): React.ReactElement | null {
  const { permission, isSubscribed, isDismissed, isLoading, subscribe, dismiss } = usePush()

  if (permission !== 'default' || isDismissed || isSubscribed) {
    return null
  }

  return (
    <div
      role="banner"
      className="flex items-center gap-3 border-b border-[#F5C518]/20 bg-[#0F0F1A] px-4 py-2.5 text-sm text-white"
    >
      <Bell className="h-4 w-4 shrink-0 text-[#F5C518]" />
      <span className="flex-1">
        Attiva le notifiche push per ricevere aggiornamenti sui tuoi post
      </span>
      <Button
        size="sm"
        className="bg-[#F5C518] text-[#0F0F1A] hover:bg-[#F5C518]/80"
        disabled={isLoading}
        onClick={subscribe}
      >
        Attiva
      </Button>
      <button
        type="button"
        aria-label="Chiudi"
        className="shrink-0 rounded p-1 text-white/60 hover:text-white"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
