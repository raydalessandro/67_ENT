import type { InstagramAccount, InstagramMedia, InstagramInsight } from '@/types/models'
import { instagramFetch } from './cache'

const BASE_URL = 'https://graph.instagram.com/v18.0'

// Default revalidation: 1 hour (3600s)
const DEFAULT_REVALIDATE = 3600

// Default metrics for insights
const DEFAULT_INSIGHT_METRICS = ['impressions', 'reach', 'profile_views']

export class InstagramClient {
  private token: string
  private accountId: string

  constructor(token: string, accountId: string) {
    this.token = token
    this.accountId = accountId
  }

  async getAccount(): Promise<InstagramAccount> {
    const fields = [
      'id',
      'username',
      'name',
      'biography',
      'followers_count',
      'follows_count',
      'media_count',
      'profile_picture_url',
      'website',
    ].join(',')

    const url = `${BASE_URL}/${this.accountId}?fields=${fields}&access_token=${this.token}`

    return instagramFetch<InstagramAccount>(url, {
      revalidate: DEFAULT_REVALIDATE,
      tags: [`instagram-account-${this.accountId}`],
    })
  }

  async getMedia(limit = 12): Promise<InstagramMedia[]> {
    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'permalink',
      'thumbnail_url',
      'timestamp',
      'username',
      'like_count',
      'comments_count',
    ].join(',')

    const url =
      `${BASE_URL}/${this.accountId}/media` +
      `?fields=${fields}&limit=${limit}&access_token=${this.token}`

    const response = await instagramFetch<{ data: InstagramMedia[] }>(url, {
      revalidate: DEFAULT_REVALIDATE,
      tags: [`instagram-media-${this.accountId}`],
    })

    return response.data
  }

  async getInsights(
    metrics: string[] = DEFAULT_INSIGHT_METRICS,
    period: 'day' | 'week' | 'days_28' = 'week'
  ): Promise<InstagramInsight[]> {
    const metricsParam = metrics.join(',')
    const url =
      `${BASE_URL}/${this.accountId}/insights` +
      `?metric=${metricsParam}&period=${period}&access_token=${this.token}`

    const response = await instagramFetch<{ data: InstagramInsight[] }>(url, {
      revalidate: DEFAULT_REVALIDATE,
      tags: [`instagram-insights-${this.accountId}`],
    })

    return response.data
  }

  async refreshToken(): Promise<{ token: string; expires_at: string }> {
    const url =
      `https://graph.instagram.com/refresh_access_token` +
      `?grant_type=ig_refresh_token&access_token=${this.token}`

    const response = await instagramFetch<{
      access_token: string
      token_type: string
      expires_in: number
    }>(url, {
      // Do not cache token refresh responses
      revalidate: 0,
      tags: [`instagram-token-${this.accountId}`],
    })

    // Compute expiry timestamp from expires_in (seconds)
    const expiresAt = new Date(Date.now() + response.expires_in * 1000).toISOString()

    return {
      token: response.access_token,
      expires_at: expiresAt,
    }
  }
}
