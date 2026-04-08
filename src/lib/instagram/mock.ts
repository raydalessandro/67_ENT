import type { InstagramAccount, InstagramMedia, InstagramInsight } from '@/types/models'

export const mockAccount: InstagramAccount = {
  id: '17841400000000001',
  username: 'artist_mock',
  name: 'Mock Artist',
  biography: 'Musica, arte e creatività. Booking: booking@mockartist.com',
  followers_count: 52_400,
  follows_count: 812,
  media_count: 247,
  profile_picture_url: 'https://example.com/profiles/artist_mock.jpg',
  website: 'https://www.mockartist.com',
}

// 12 items: 4 IMAGE, 4 VIDEO, 4 CAROUSEL_ALBUM
// timestamps spread across ~4 weeks (newest-first)
// varied engagement: 200-3000 likes, different days and hours
export const mockMedia: InstagramMedia[] = [
  // ── Week 4 (newest) ───────────────────────────────────────────────────────
  {
    id: 'm01',
    caption: 'Nuovo singolo disponibile ovunque 🎵 #musica #nuovosingolo',
    media_type: 'VIDEO',
    media_url: 'https://example.com/media/m01.mp4',
    permalink: 'https://www.instagram.com/p/m01/',
    thumbnail_url: 'https://example.com/media/m01_thumb.jpg',
    timestamp: '2024-01-28T18:00:00Z', // Sunday 18:00 UTC
    username: 'artist_mock',
    like_count: 2_850,
    comments_count: 134,
  },
  {
    id: 'm02',
    caption: 'Backstage del video ufficiale',
    media_type: 'CAROUSEL_ALBUM',
    media_url: 'https://example.com/media/m02_1.jpg',
    permalink: 'https://www.instagram.com/p/m02/',
    thumbnail_url: null,
    timestamp: '2024-01-26T14:30:00Z', // Friday 14:30 UTC
    username: 'artist_mock',
    like_count: 1_920,
    comments_count: 87,
  },
  {
    id: 'm03',
    caption: 'Studio session — album in arrivo!',
    media_type: 'IMAGE',
    media_url: 'https://example.com/media/m03.jpg',
    permalink: 'https://www.instagram.com/p/m03/',
    thumbnail_url: null,
    timestamp: '2024-01-25T10:00:00Z', // Thursday 10:00 UTC
    username: 'artist_mock',
    like_count: 1_100,
    comments_count: 45,
  },

  // ── Week 3 ────────────────────────────────────────────────────────────────
  {
    id: 'm04',
    caption: 'Live a Milano — ci vediamo lì!',
    media_type: 'VIDEO',
    media_url: 'https://example.com/media/m04.mp4',
    permalink: 'https://www.instagram.com/p/m04/',
    thumbnail_url: 'https://example.com/media/m04_thumb.jpg',
    timestamp: '2024-01-22T20:00:00Z', // Monday 20:00 UTC
    username: 'artist_mock',
    like_count: 3_000,
    comments_count: 178,
  },
  {
    id: 'm05',
    caption: 'Grazie a tutti per il supporto ❤️',
    media_type: 'IMAGE',
    media_url: 'https://example.com/media/m05.jpg',
    permalink: 'https://www.instagram.com/p/m05/',
    thumbnail_url: null,
    timestamp: '2024-01-20T16:00:00Z', // Saturday 16:00 UTC
    username: 'artist_mock',
    like_count: 780,
    comments_count: 33,
  },
  {
    id: 'm06',
    caption: 'Processo creativo: step by step',
    media_type: 'CAROUSEL_ALBUM',
    media_url: 'https://example.com/media/m06_1.jpg',
    permalink: 'https://www.instagram.com/p/m06/',
    thumbnail_url: null,
    timestamp: '2024-01-18T08:00:00Z', // Thursday 08:00 UTC
    username: 'artist_mock',
    like_count: 1_450,
    comments_count: 62,
  },

  // ── Week 2 ────────────────────────────────────────────────────────────────
  {
    id: 'm07',
    caption: 'Cover reveal 👀 #album',
    media_type: 'IMAGE',
    media_url: 'https://example.com/media/m07.jpg',
    permalink: 'https://www.instagram.com/p/m07/',
    thumbnail_url: null,
    timestamp: '2024-01-15T19:00:00Z', // Monday 19:00 UTC
    username: 'artist_mock',
    like_count: 2_300,
    comments_count: 115,
  },
  {
    id: 'm08',
    caption: 'Q&A in diretta domani alle 21!',
    media_type: 'VIDEO',
    media_url: 'https://example.com/media/m08.mp4',
    permalink: 'https://www.instagram.com/p/m08/',
    thumbnail_url: 'https://example.com/media/m08_thumb.jpg',
    timestamp: '2024-01-13T12:00:00Z', // Saturday 12:00 UTC
    username: 'artist_mock',
    like_count: 1_650,
    comments_count: 201,
  },
  {
    id: 'm09',
    caption: 'Dietro le quinte del tour',
    media_type: 'CAROUSEL_ALBUM',
    media_url: 'https://example.com/media/m09_1.jpg',
    permalink: 'https://www.instagram.com/p/m09/',
    thumbnail_url: null,
    timestamp: '2024-01-11T09:00:00Z', // Thursday 09:00 UTC
    username: 'artist_mock',
    like_count: 960,
    comments_count: 44,
  },

  // ── Week 1 (oldest) ───────────────────────────────────────────────────────
  {
    id: 'm10',
    caption: 'Inizio anno, nuovi progetti!',
    media_type: 'IMAGE',
    media_url: 'https://example.com/media/m10.jpg',
    permalink: 'https://www.instagram.com/p/m10/',
    thumbnail_url: null,
    timestamp: '2024-01-07T11:00:00Z', // Sunday 11:00 UTC
    username: 'artist_mock',
    like_count: 540,
    comments_count: 28,
  },
  {
    id: 'm11',
    caption: 'Sneak peek del prossimo video 🎬',
    media_type: 'VIDEO',
    media_url: 'https://example.com/media/m11.mp4',
    permalink: 'https://www.instagram.com/p/m11/',
    thumbnail_url: 'https://example.com/media/m11_thumb.jpg',
    timestamp: '2024-01-05T17:00:00Z', // Friday 17:00 UTC
    username: 'artist_mock',
    like_count: 1_200,
    comments_count: 77,
  },
  {
    id: 'm12',
    caption: 'Auguri di buon anno! 🎉 #2024',
    media_type: 'CAROUSEL_ALBUM',
    media_url: 'https://example.com/media/m12_1.jpg',
    permalink: 'https://www.instagram.com/p/m12/',
    thumbnail_url: null,
    timestamp: '2024-01-01T00:00:00Z', // Monday 00:00 UTC
    username: 'artist_mock',
    like_count: 2_100,
    comments_count: 156,
  },
]

export const mockInsights: InstagramInsight[] = [
  {
    name: 'impressions',
    period: 'week',
    values: [
      { value: 48_200, end_time: '2024-01-21T07:00:00+0000' },
      { value: 52_700, end_time: '2024-01-28T07:00:00+0000' },
    ],
    title: 'Impressioni',
    description: 'Numero totale di volte in cui i post sono stati visualizzati',
  },
  {
    name: 'reach',
    period: 'week',
    values: [
      { value: 22_100, end_time: '2024-01-21T07:00:00+0000' },
      { value: 24_800, end_time: '2024-01-28T07:00:00+0000' },
    ],
    title: 'Copertura',
    description: 'Numero di account unici che hanno visto i post',
  },
  {
    name: 'profile_views',
    period: 'week',
    values: [
      { value: 3_450, end_time: '2024-01-21T07:00:00+0000' },
      { value: 4_120, end_time: '2024-01-28T07:00:00+0000' },
    ],
    title: 'Visualizzazioni profilo',
    description: 'Numero di volte in cui il profilo è stato visitato',
  },
]
