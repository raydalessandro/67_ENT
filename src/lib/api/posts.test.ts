import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBrowserClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(),
}))

function createMockSupabase() {
  const mockResult = { data: null, error: null }
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(mockResult),
    upsert: vi.fn().mockReturnThis(),
    schema: vi.fn().mockReturnThis(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
  }
  // Make the chain itself thenable so query() can await it
  chain.then = vi.fn((resolve: any) => Promise.resolve(mockResult).then(resolve))
  return { chain, mockResult }
}

describe('posts.ts', () => {
  let chain: any
  let mockResult: { data: any; error: any }

  beforeEach(() => {
    vi.clearAllMocks()
    const mock = createMockSupabase()
    chain = mock.chain
    mockResult = mock.mockResult
    ;(createBrowserClient as any).mockReturnValue(chain)
  })

  // ── getPosts ──

  describe('getPosts', () => {
    it('queries posts_with_details table ordered by created_at desc', async () => {
      mockResult.data = []
      chain.then = vi.fn((resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve))

      const { getPosts } = await import('./posts')
      const result = await getPosts()

      expect(chain.from).toHaveBeenCalledWith('posts_with_details')
      expect(chain.select).toHaveBeenCalledWith('*')
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result.ok).toBe(true)
    })

    it('applies artist_id filter', async () => {
      chain.then = vi.fn((resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve))

      const { getPosts } = await import('./posts')
      await getPosts({ artist_id: 'artist-1' })

      expect(chain.eq).toHaveBeenCalledWith('artist_id', 'artist-1')
    })

    it('applies status filter', async () => {
      chain.then = vi.fn((resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve))

      const { getPosts } = await import('./posts')
      await getPosts({ status: 'draft' })

      expect(chain.eq).toHaveBeenCalledWith('status', 'draft')
    })

    it('applies platform filter with contains', async () => {
      chain.then = vi.fn((resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve))

      const { getPosts } = await import('./posts')
      await getPosts({ platform: 'instagram_feed' })

      expect(chain.contains).toHaveBeenCalledWith('platforms', ['instagram_feed'])
    })

    it('applies from_date filter with gte', async () => {
      chain.then = vi.fn((resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve))

      const { getPosts } = await import('./posts')
      await getPosts({ from_date: '2024-01-01' })

      expect(chain.gte).toHaveBeenCalledWith('scheduled_date', '2024-01-01')
    })

    it('applies to_date filter with lte', async () => {
      chain.then = vi.fn((resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve))

      const { getPosts } = await import('./posts')
      await getPosts({ to_date: '2024-12-31' })

      expect(chain.lte).toHaveBeenCalledWith('scheduled_date', '2024-12-31')
    })

    it('returns error when supabase fails', async () => {
      chain.then = vi.fn((resolve: any) =>
        Promise.resolve({ data: null, error: { message: 'fail', code: 'UNKNOWN' } }).then(resolve)
      )

      const { getPosts } = await import('./posts')
      const result = await getPosts()

      expect(result.ok).toBe(false)
    })
  })

  // ── createPost ──

  describe('createPost', () => {
    it('inserts into posts table and returns single', async () => {
      const post = { id: 'p1', title: 'Test', status: 'draft' }
      chain.single = vi.fn().mockResolvedValue({ data: post, error: null })

      const { createPost } = await import('./posts')
      const result = await createPost({
        artist_id: 'a1',
        title: 'Test',
        platforms: ['instagram_feed'],
      })

      expect(chain.from).toHaveBeenCalledWith('posts')
      expect(chain.insert).toHaveBeenCalled()
      expect(chain.select).toHaveBeenCalled()
      expect(chain.single).toHaveBeenCalled()
      expect(result.ok).toBe(true)
    })
  })

  // ── updatePost ──

  describe('updatePost', () => {
    it('updates posts table with eq id', async () => {
      const post = { id: 'p1', title: 'Updated' }
      chain.single = vi.fn().mockResolvedValue({ data: post, error: null })

      const { updatePost } = await import('./posts')
      const result = await updatePost('p1', { title: 'Updated' })

      expect(chain.from).toHaveBeenCalledWith('posts')
      expect(chain.update).toHaveBeenCalledWith({ title: 'Updated' })
      expect(chain.eq).toHaveBeenCalledWith('id', 'p1')
      expect(result.ok).toBe(true)
    })
  })

  // ── sendForReview ──

  describe('sendForReview', () => {
    it('updates status to in_review with status guard on draft', async () => {
      const post = { id: 'p1', status: 'in_review' }
      chain.single = vi.fn().mockResolvedValue({ data: post, error: null })

      const { sendForReview } = await import('./posts')
      const result = await sendForReview('p1')

      expect(chain.update).toHaveBeenCalledWith({ status: 'in_review' })
      expect(chain.eq).toHaveBeenCalledWith('status', 'draft')
      expect(result.ok).toBe(true)
    })
  })

  // ── approve ──

  describe('approve', () => {
    it('updates status to approved with status guard on in_review', async () => {
      const post = { id: 'p1', status: 'approved' }
      chain.single = vi.fn().mockResolvedValue({ data: post, error: null })

      const { approve } = await import('./posts')
      const result = await approve('p1')

      expect(chain.update).toHaveBeenCalledWith({ status: 'approved' })
      expect(chain.eq).toHaveBeenCalledWith('status', 'in_review')
      expect(result.ok).toBe(true)
    })
  })

  // ── reject ──

  describe('reject', () => {
    it('returns INVALID_INPUT when reason is empty', async () => {
      const { reject } = await import('./posts')
      const result = await reject('p1', '')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT')
      }
    })

    it('returns INVALID_INPUT when reason is whitespace only', async () => {
      const { reject } = await import('./posts')
      const result = await reject('p1', '   ')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT')
      }
    })

    it('updates status to rejected with reason and status guard on in_review', async () => {
      const post = { id: 'p1', status: 'rejected', rejection_reason: 'Not good' }
      chain.single = vi.fn().mockResolvedValue({ data: post, error: null })

      const { reject } = await import('./posts')
      const result = await reject('p1', 'Not good')

      expect(chain.update).toHaveBeenCalledWith({
        status: 'rejected',
        rejection_reason: 'Not good',
      })
      expect(chain.eq).toHaveBeenCalledWith('status', 'in_review')
      expect(result.ok).toBe(true)
    })
  })

  // ── markPublished ──

  describe('markPublished', () => {
    it('updates status to published with status guard on approved', async () => {
      const post = { id: 'p1', status: 'published' }
      chain.single = vi.fn().mockResolvedValue({ data: post, error: null })

      const { markPublished } = await import('./posts')
      const result = await markPublished('p1')

      expect(chain.update).toHaveBeenCalledWith({ status: 'published' })
      expect(chain.eq).toHaveBeenCalledWith('status', 'approved')
      expect(result.ok).toBe(true)
    })
  })

  // ── addComment ──

  describe('addComment', () => {
    it('inserts into post_comments with post_id and content', async () => {
      const comment = { id: 'c1', post_id: 'p1', content: 'Great!' }
      chain.single = vi.fn().mockResolvedValue({ data: comment, error: null })

      const { addComment } = await import('./posts')
      const result = await addComment('p1', 'Great!')

      expect(chain.from).toHaveBeenCalledWith('post_comments')
      expect(chain.insert).toHaveBeenCalledWith({ post_id: 'p1', content: 'Great!', user_id: 'user-1' })
      expect(result.ok).toBe(true)
    })
  })

  // ── deleteComment ──

  describe('deleteComment', () => {
    it('deletes from post_comments by id', async () => {
      // deleteComment uses delete().eq().then directly, not through query()
      chain.delete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const { deleteComment } = await import('./posts')
      const result = await deleteComment('c1')

      expect(chain.from).toHaveBeenCalledWith('post_comments')
      expect(chain.delete).toHaveBeenCalled()
      expect(result.ok).toBe(true)
    })

    it('returns error when delete fails', async () => {
      chain.delete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail', code: 'UNKNOWN' } }),
      })

      const { deleteComment } = await import('./posts')
      const result = await deleteComment('c1')

      expect(result.ok).toBe(false)
    })
  })
})
