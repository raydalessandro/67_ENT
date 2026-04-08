'use client'

import { useCallback, useEffect, useState } from 'react'
import { registerPushSubscription, unregisterPushSubscription } from '@/lib/api/notifications'

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

const DISMISSED_KEY = 'push-dismissed'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    Boolean(navigator.serviceWorker) &&
    'PushManager' in window
  )
}

export function usePush(): {
  permission: PushPermission
  isSubscribed: boolean
  isLoading: boolean
  subscribe(): Promise<void>
  unsubscribe(): Promise<void>
  dismiss(): void
  isDismissed: boolean
} {
  const [permission, setPermission] = useState<PushPermission>(() => {
    if (!isSupported()) return 'unsupported'
    return Notification.permission as PushPermission
  })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(DISMISSED_KEY) === 'true'
  })

  // Register SW and check existing subscription on mount
  useEffect(() => {
    if (!isSupported()) return

    async function init() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const existing = await registration.pushManager.getSubscription()
        setIsSubscribed(existing !== null)
        setPermission(Notification.permission as PushPermission)
      } catch {
        // SW registration failed — treat as unsupported
      }
    }

    init()
  }, [])

  const subscribe = useCallback(async () => {
    if (!isSupported()) return

    setIsLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)

      if (perm !== 'granted') return

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('[use-push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      const json = subscription.toJSON()
      await registerPushSubscription({
        endpoint: json.endpoint!,
        keys: {
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!,
        },
        userAgent: navigator.userAgent,
      })

      setIsSubscribed(true)
    } catch (err) {
      console.error('[use-push] subscribe failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!isSupported()) return

    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe()
        await unregisterPushSubscription(endpoint)
      }

      setIsSubscribed(false)
    } catch (err) {
      console.error('[use-push] unsubscribe failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setIsDismissed(true)
  }, [])

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe, dismiss, isDismissed }
}
