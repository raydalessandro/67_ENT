import { describe, it, expect } from 'vitest'
import { mapPostsToEvents } from '../calendar-view'
import type { PostWithDetails, PostStatus } from '@/types/models'

function makePost(overrides: Partial<PostWithDetails> = {}): PostWithDetails {
  return {
    id: 'post-1',
    artist_id: 'artist-1',
    title: 'Test Post',
    caption: null,
    hashtags: null,
    platforms: ['instagram_feed'],
    status: 'approved',
    scheduled_date: '2026-04-15',
    created_by: 'user-1',
    approved_by: null,
    rejection_reason: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    artist_name: 'Test Artist',
    artist_color: '#FF6B6B',
    media_count: 1,
    comment_count: 0,
    ...overrides,
  }
}

describe('mapPostsToEvents', () => {
  it('maps posts correctly with title, start date, and colors', () => {
    const posts = [makePost()]
    const events = mapPostsToEvents(posts)

    expect(events).toHaveLength(1)
    expect(events[0].id).toBe('post-1')
    expect(events[0].title).toBe('Test Post')
    expect(events[0].start).toBe('2026-04-15')
    expect(events[0].extendedProps.post).toBe(posts[0])
  })

  it('excludes posts without scheduled_date', () => {
    const posts = [
      makePost({ id: 'with-date', scheduled_date: '2026-04-15' }),
      makePost({ id: 'no-date', scheduled_date: null }),
    ]
    const events = mapPostsToEvents(posts)

    expect(events).toHaveLength(1)
    expect(events[0].id).toBe('with-date')
  })

  it('applies correct opacity for draft status (0.4)', () => {
    const posts = [makePost({ status: 'draft', artist_color: '#FF0000' })]
    const events = mapPostsToEvents(posts)

    expect(events[0].backgroundColor).toBe('rgba(255, 0, 0, 0.4)')
    expect(events[0].borderColor).toBe('rgba(255, 0, 0, 0.4)')
  })

  it('applies correct opacity for in_review status (0.7)', () => {
    const posts = [makePost({ status: 'in_review', artist_color: '#00FF00' })]
    const events = mapPostsToEvents(posts)

    expect(events[0].backgroundColor).toBe('rgba(0, 255, 0, 0.7)')
  })

  it('applies correct opacity for approved status (1.0)', () => {
    const posts = [makePost({ status: 'approved', artist_color: '#0000FF' })]
    const events = mapPostsToEvents(posts)

    expect(events[0].backgroundColor).toBe('rgba(0, 0, 255, 1)')
  })

  it('applies correct opacity for published status (1.0)', () => {
    const posts = [makePost({ status: 'published', artist_color: '#0000FF' })]
    const events = mapPostsToEvents(posts)

    expect(events[0].backgroundColor).toBe('rgba(0, 0, 255, 1)')
  })

  it('applies correct opacity for rejected status (0.3)', () => {
    const posts = [makePost({ status: 'rejected', artist_color: '#FF6B6B' })]
    const events = mapPostsToEvents(posts)

    expect(events[0].backgroundColor).toBe('rgba(255, 107, 107, 0.3)')
  })

  it('handles empty array', () => {
    const events = mapPostsToEvents([])
    expect(events).toEqual([])
  })

  it('maps multiple posts preserving order', () => {
    const posts = [
      makePost({ id: 'a', title: 'First', scheduled_date: '2026-04-10' }),
      makePost({ id: 'b', title: 'Second', scheduled_date: '2026-04-20' }),
      makePost({ id: 'c', title: 'Third', scheduled_date: null }),
    ]
    const events = mapPostsToEvents(posts)

    expect(events).toHaveLength(2)
    expect(events[0].id).toBe('a')
    expect(events[1].id).toBe('b')
  })

  it('uses artist_color from each post individually', () => {
    const posts = [
      makePost({ id: '1', artist_color: '#F5C518', status: 'approved' }),
      makePost({ id: '2', artist_color: '#4ECDC4', status: 'approved' }),
    ]
    const events = mapPostsToEvents(posts)

    expect(events[0].backgroundColor).toBe('rgba(245, 197, 24, 1)')
    expect(events[1].backgroundColor).toBe('rgba(78, 205, 196, 1)')
  })
})
