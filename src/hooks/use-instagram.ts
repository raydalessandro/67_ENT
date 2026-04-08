'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { calculateMetrics, getRecommendations } from '@/lib/instagram/metrics'
import { mockAccount, mockMedia, mockInsights } from '@/lib/instagram/mock'
import type { InstagramAccount, InstagramMedia, InstagramInsight, DerivedMetrics } from '@/types/models'

const RATE_LIMIT_MS = 5 * 60 * 1000 // 5 minutes

export function useInstagramData(artistId: string): {
  account: InstagramAccount | null
  media: InstagramMedia[]
  insights: InstagramInsight[]
  metrics: DerivedMetrics | null
  recommendations: string[]
  isLoading: boolean
  error: string | null
  refresh(): Promise<void>
  lastRefreshed: Date | null
} {
  const [account, setAccount] = useState<InstagramAccount | null>(null)
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [insights, setInsights] = useState<InstagramInsight[]>([])
  const [metrics, setMetrics] = useState<DerivedMetrics | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const lastRefreshTimeRef = useRef<number | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const [accountResult, mediaResult, insightsResult] = await Promise.allSettled([
      fetch(`/api/instagram/${artistId}?type=account`).then((r) => r.json()),
      fetch(`/api/instagram/${artistId}?type=media`).then((r) => r.json()),
      fetch(`/api/instagram/${artistId}?type=insights`).then((r) => r.json()),
    ])

    const allFailed =
      accountResult.status === 'rejected' &&
      mediaResult.status === 'rejected' &&
      insightsResult.status === 'rejected'

    if (allFailed) {
      setAccount(mockAccount)
      setMedia(mockMedia)
      setInsights(mockInsights)
      const derivedMetrics = calculateMetrics(mockMedia, mockAccount.followers_count)
      setMetrics(derivedMetrics)
      setRecommendations(getRecommendations(derivedMetrics, mockMedia))
      setError('Dati Instagram non disponibili')
      setIsLoading(false)
      return
    }

    const resolvedAccount: InstagramAccount | null =
      accountResult.status === 'fulfilled' ? (accountResult.value as InstagramAccount) : mockAccount

    const resolvedMedia: InstagramMedia[] =
      mediaResult.status === 'fulfilled' ? (mediaResult.value as InstagramMedia[]) : mockMedia

    const resolvedInsights: InstagramInsight[] =
      insightsResult.status === 'fulfilled'
        ? (insightsResult.value as InstagramInsight[])
        : mockInsights

    setAccount(resolvedAccount)
    setMedia(resolvedMedia)
    setInsights(resolvedInsights)

    const followersCount = resolvedAccount?.followers_count ?? 0
    const derivedMetrics = calculateMetrics(resolvedMedia, followersCount)
    setMetrics(derivedMetrics)
    setRecommendations(getRecommendations(derivedMetrics, resolvedMedia))

    const now = new Date()
    setLastRefreshed(now)
    lastRefreshTimeRef.current = now.getTime()

    setIsLoading(false)
  }, [artistId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(async () => {
    const now = Date.now()
    if (lastRefreshTimeRef.current !== null && now - lastRefreshTimeRef.current < RATE_LIMIT_MS) {
      return
    }
    await fetchData()
  }, [fetchData])

  return { account, media, insights, metrics, recommendations, isLoading, error, refresh, lastRefreshed }
}
