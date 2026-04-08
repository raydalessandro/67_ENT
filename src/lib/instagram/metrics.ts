import type { InstagramMedia, DerivedMetrics } from '@/types/models'

const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

const ZEROED_CONTENT_TYPE_PERFORMANCE: DerivedMetrics['contentTypePerformance'] = {
  IMAGE: { count: 0, avgEngagement: 0 },
  VIDEO: { count: 0, avgEngagement: 0 },
  CAROUSEL_ALBUM: { count: 0, avgEngagement: 0 },
}

const ZEROED_METRICS: DerivedMetrics = {
  engagementRate: 0,
  avgLikesPerPost: 0,
  avgCommentsPerPost: 0,
  totalEngagement: 0,
  bestPostingDay: 'N/D',
  peakEngagementHour: 12,
  contentTypePerformance: {
    IMAGE: { count: 0, avgEngagement: 0 },
    VIDEO: { count: 0, avgEngagement: 0 },
    CAROUSEL_ALBUM: { count: 0, avgEngagement: 0 },
  },
  postFrequencyPerWeek: 0,
}

export function calculateMetrics(media: InstagramMedia[], followersCount: number): DerivedMetrics {
  // STEP 1: Guard — empty array returns zeroed metrics
  if (media.length === 0) {
    return { ...ZEROED_METRICS, contentTypePerformance: { ...ZEROED_CONTENT_TYPE_PERFORMANCE } }
  }

  // STEP 2: Compute totals
  let totalLikes = 0
  let totalComments = 0

  // Day buckets: index 0-6 (Sunday-Saturday), value = total engagement for that day
  const dayEngagement: number[] = new Array(7).fill(0)
  // Hour buckets: index 0-23, value = total engagement for that hour
  const hourEngagement: number[] = new Array(24).fill(0)

  // Content type accumulator
  const typeAccumulator: Record<
    'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM',
    { count: number; totalEngagement: number }
  > = {
    IMAGE: { count: 0, totalEngagement: 0 },
    VIDEO: { count: 0, totalEngagement: 0 },
    CAROUSEL_ALBUM: { count: 0, totalEngagement: 0 },
  }

  for (const post of media) {
    const engagement = post.like_count + post.comments_count
    totalLikes += post.like_count
    totalComments += post.comments_count

    const date = new Date(post.timestamp)
    const day = date.getDay() // 0=Sunday .. 6=Saturday
    const hour = date.getUTCHours() // 0-23

    dayEngagement[day] += engagement
    hourEngagement[hour] += engagement

    const type = post.media_type
    typeAccumulator[type].count += 1
    typeAccumulator[type].totalEngagement += engagement
  }

  // STEP 3: Derived scalars
  const totalEngagement = totalLikes + totalComments

  // engagementRate guard: 0 if followersCount === 0
  const engagementRate =
    followersCount === 0
      ? 0
      : (totalEngagement / (followersCount * media.length)) * 100

  const avgLikesPerPost = totalLikes / media.length
  const avgCommentsPerPost = totalComments / media.length

  // STEP 4: bestPostingDay — find day index with max engagement, default 'N/D'
  let bestDayIndex = -1
  let bestDayValue = -1
  for (let i = 0; i < 7; i++) {
    if (dayEngagement[i] > bestDayValue) {
      bestDayValue = dayEngagement[i]
      bestDayIndex = i
    }
  }
  const bestPostingDay = bestDayIndex >= 0 && bestDayValue > 0 ? DAY_NAMES[bestDayIndex] : 'N/D'

  // STEP 5: peakEngagementHour — hour with max engagement, default 12
  let peakHour = 12
  let peakHourValue = -1
  for (let i = 0; i < 24; i++) {
    if (hourEngagement[i] > peakHourValue) {
      peakHourValue = hourEngagement[i]
      peakHour = i
    }
  }
  const peakEngagementHour = peakHourValue > 0 ? peakHour : 12

  // STEP 6: contentTypePerformance — count + avgEngagement per type
  const contentTypePerformance: DerivedMetrics['contentTypePerformance'] = {
    IMAGE: {
      count: typeAccumulator.IMAGE.count,
      avgEngagement:
        typeAccumulator.IMAGE.count > 0
          ? typeAccumulator.IMAGE.totalEngagement / typeAccumulator.IMAGE.count
          : 0,
    },
    VIDEO: {
      count: typeAccumulator.VIDEO.count,
      avgEngagement:
        typeAccumulator.VIDEO.count > 0
          ? typeAccumulator.VIDEO.totalEngagement / typeAccumulator.VIDEO.count
          : 0,
    },
    CAROUSEL_ALBUM: {
      count: typeAccumulator.CAROUSEL_ALBUM.count,
      avgEngagement:
        typeAccumulator.CAROUSEL_ALBUM.count > 0
          ? typeAccumulator.CAROUSEL_ALBUM.totalEngagement / typeAccumulator.CAROUSEL_ALBUM.count
          : 0,
    },
  }

  // STEP 7: postFrequencyPerWeek
  // media is newest-first → newest = media[0], oldest = media[media.length - 1]
  const newestMs = new Date(media[0].timestamp).getTime()
  const oldestMs = new Date(media[media.length - 1].timestamp).getTime()
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
  const spanWeeks = (newestMs - oldestMs) / MS_PER_WEEK
  const postFrequencyPerWeek = media.length / Math.max(spanWeeks, 1)

  return {
    engagementRate,
    avgLikesPerPost,
    avgCommentsPerPost,
    totalEngagement,
    bestPostingDay,
    peakEngagementHour,
    contentTypePerformance,
    postFrequencyPerWeek,
  }
}

export function getRecommendations(metrics: DerivedMetrics, media: InstagramMedia[]): string[] {
  const recommendations: string[] = []

  // STEP 1: engagementRate rule
  if (metrics.engagementRate < 1) {
    recommendations.push(
      "Il tuo tasso di engagement è molto basso (<1%). Prova a interagire di più con la community e a creare contenuti che invitino alla partecipazione."
    )
  } else if (metrics.engagementRate < 3) {
    recommendations.push(
      `Il tuo tasso di engagement è intorno al ${metrics.engagementRate.toFixed(1)}%. Sei sulla buona strada, continua a sperimentare per superare il 3%.`
    )
  } else {
    recommendations.push(
      `Ottimo tasso di engagement (${metrics.engagementRate.toFixed(1)}%)! Continua così, il tuo pubblico è molto coinvolto.`
    )
  }

  // STEP 2: bestPostingDay recommendation
  if (metrics.bestPostingDay !== 'N/D') {
    recommendations.push(
      `Pubblica di preferenza il ${metrics.bestPostingDay}: è il giorno in cui ottieni il maggior coinvolgimento.`
    )
  }

  // STEP 3: peakEngagementHour recommendation
  recommendations.push(
    `L'orario migliore per pubblicare è intorno alle ${metrics.peakEngagementHour}:00 UTC, quando il tuo pubblico è più attivo.`
  )

  // STEP 4: Best content type recommendation
  const types = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'] as const
  let bestType: (typeof types)[number] | null = null
  let bestTypeAvgEngagement = -1
  for (const type of types) {
    const perf = metrics.contentTypePerformance[type]
    if (perf.count > 0 && perf.avgEngagement > bestTypeAvgEngagement) {
      bestTypeAvgEngagement = perf.avgEngagement
      bestType = type
    }
  }
  if (bestType !== null && recommendations.length < 5) {
    const typeLabels: Record<typeof types[number], string> = {
      IMAGE: 'immagini',
      VIDEO: 'video',
      CAROUSEL_ALBUM: 'caroselli',
    }
    recommendations.push(
      `I contenuti di tipo ${typeLabels[bestType]} performano meglio (media ${bestTypeAvgEngagement.toFixed(0)} engagement). Punta su questo formato.`
    )
  }

  // STEP 5: Suggest video if no VIDEO and media.length >= 5
  if (
    recommendations.length < 5 &&
    metrics.contentTypePerformance.VIDEO.count === 0 &&
    media.length >= 5
  ) {
    recommendations.push(
      "Non hai ancora pubblicato video. Prova con i Reels o video brevi: tendono ad avere un reach organico maggiore."
    )
  }

  // STEP 6: postFrequencyPerWeek
  if (recommendations.length < 5) {
    if (metrics.postFrequencyPerWeek < 3) {
      recommendations.push(
        `Stai pubblicando circa ${metrics.postFrequencyPerWeek.toFixed(1)} volte a settimana. Aumenta la frequenza ad almeno 3 post/settimana per mantenere la visibilità.`
      )
    } else if (metrics.postFrequencyPerWeek > 14) {
      recommendations.push(
        `Stai pubblicando molto spesso (${metrics.postFrequencyPerWeek.toFixed(0)} post/settimana). Considera di ridurre la quantità e puntare di più sulla qualità.`
      )
    }
  }

  // Cap at 5
  return recommendations.slice(0, 5)
}
