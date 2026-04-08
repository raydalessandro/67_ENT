'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useInstagramData } from '@/hooks/use-instagram'
import { AccountOverview } from '@/components/analytics/account-overview'
import { KpiCard } from '@/components/analytics/kpi-card'
import { EngagementChart } from '@/components/analytics/engagement-chart'
import { ContentTypeChart } from '@/components/analytics/content-type-chart'
import { BestDayCard, PeakHourCard } from '@/components/analytics/timing-cards'
import { Recommendations } from '@/components/analytics/recommendations'
import { useEffect } from 'react'

export default function ArtistAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const { isStaff, isLoading: authLoading } = useAuth()
  const artistId = params.artistId as string
  const { account, insights, metrics, recommendations, isLoading, error, refresh, lastRefreshed } = useInstagramData(artistId)

  useEffect(() => {
    if (!authLoading && !isStaff) router.replace('/')
  }, [authLoading, isStaff, router])

  if (authLoading || isLoading) {
    return <div className="p-6 space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-48 bg-[#13131F] rounded-xl animate-pulse" />)}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/analytics')} className="text-gray-400 hover:text-white">← Indietro</button>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && <span className="text-xs text-gray-500">Aggiornato: {lastRefreshed.toLocaleTimeString('it-IT')}</span>}
          <button onClick={refresh} className="px-4 py-2 bg-[#F5C518] text-black font-bold rounded-lg hover:bg-[#F5C518]/90 text-sm">Aggiorna</button>
        </div>
      </div>

      {error && <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-yellow-300 text-sm">{error}</div>}

      {account && <AccountOverview account={account} />}

      {metrics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Engagement Rate" value={`${metrics.engagementRate.toFixed(2)}%`} icon="📊" subtitle="Media per post" trend={metrics.engagementRate >= 3 ? 'up' : metrics.engagementRate < 1 ? 'down' : 'neutral'} />
            <KpiCard label="Like Medi" value={Math.round(metrics.avgLikesPerPost).toLocaleString()} icon="❤️" subtitle="Per post" />
            <KpiCard label="Commenti Medi" value={Math.round(metrics.avgCommentsPerPost).toLocaleString()} icon="💬" subtitle="Per post" />
            <KpiCard label="Engagement Totale" value={metrics.totalEngagement.toLocaleString()} icon="🎯" subtitle={`Su ${account?.media_count ?? 0} post`} />
          </div>

          <EngagementChart insights={insights} />
          <ContentTypeChart performance={metrics.contentTypePerformance} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BestDayCard day={metrics.bestPostingDay} />
            <PeakHourCard hour={metrics.peakEngagementHour} />
          </div>

          <Recommendations items={recommendations} />
        </>
      )}
    </div>
  )
}
