import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBrowserClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(),
}))

function createMockSupabase() {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  chain.then = vi.fn((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve)
  )
  return chain
}

describe('guidelines.ts', () => {
  let chain: any

  beforeEach(() => {
    vi.clearAllMocks()
    chain = createMockSupabase()
    ;(createBrowserClient as any).mockReturnValue(chain)
  })

  // ── getSections ──

  describe('getSections', () => {
    it('queries guideline_sections ordered by display_order', async () => {
      chain.then = vi.fn((resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve)
      )

      const { getSections } = await import('./guidelines')
      const result = await getSections()

      expect(chain.from).toHaveBeenCalledWith('guideline_sections')
      expect(chain.select).toHaveBeenCalledWith('*')
      expect(chain.order).toHaveBeenCalledWith('display_order')
      expect(result.ok).toBe(true)
    })
  })

  // ── createSection ──

  describe('createSection', () => {
    it('inserts into guideline_sections with generated slug', async () => {
      const section = { id: 's1', title: 'My Section', slug: 'my-section-abc12' }
      chain.single = vi.fn().mockResolvedValue({ data: section, error: null })

      const { createSection } = await import('./guidelines')
      const result = await createSection({ title: 'My Section' })

      expect(chain.from).toHaveBeenCalledWith('guideline_sections')
      expect(chain.insert).toHaveBeenCalled()
      const insertArg = chain.insert.mock.calls[0][0]
      // slug should contain the lowercase title words joined with dashes
      expect(insertArg.slug).toMatch(/^my-section-/)
      expect(insertArg.title).toBe('My Section')
      expect(result.ok).toBe(true)
    })

    it('generates different slugs for repeated calls', async () => {
      chain.single = vi.fn().mockResolvedValue({
        data: { id: 's1', title: 'Test', slug: 'test-xxxxx' },
        error: null,
      })

      const { createSection } = await import('./guidelines')
      await createSection({ title: 'Test' })
      await createSection({ title: 'Test' })

      const slug1 = chain.insert.mock.calls[0][0].slug
      const slug2 = chain.insert.mock.calls[1][0].slug
      // Different random suffixes
      expect(slug1).not.toBe(slug2)
    })
  })

  // ── getItems ──

  describe('getItems', () => {
    it('queries guideline_items_full view filtered by section_id', async () => {
      chain.then = vi.fn((resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve)
      )

      const { getItems } = await import('./guidelines')
      await getItems('section-1')

      expect(chain.from).toHaveBeenCalledWith('guideline_items_full')
      expect(chain.eq).toHaveBeenCalledWith('section_id', 'section-1')
      expect(chain.order).toHaveBeenCalledWith('display_order')
    })
  })

  // ── createItem ──

  describe('createItem', () => {
    it('inserts into guideline_items', async () => {
      const item = { id: 'i1', title: 'Item', content: 'Content' }
      chain.single = vi.fn().mockResolvedValue({ data: item, error: null })

      const { createItem } = await import('./guidelines')
      const result = await createItem({
        section_id: 's1',
        title: 'Item',
        content: 'Content',
      })

      expect(chain.from).toHaveBeenCalledWith('guideline_items')
      expect(chain.insert).toHaveBeenCalled()
      expect(result.ok).toBe(true)
    })
  })

  // ── updateItem ──

  describe('updateItem', () => {
    it('updates guideline_items by id', async () => {
      const item = { id: 'i1', title: 'Updated' }
      chain.single = vi.fn().mockResolvedValue({ data: item, error: null })

      const { updateItem } = await import('./guidelines')
      const result = await updateItem('i1', { title: 'Updated' })

      expect(chain.from).toHaveBeenCalledWith('guideline_items')
      expect(chain.update).toHaveBeenCalledWith({ title: 'Updated' })
      expect(chain.eq).toHaveBeenCalledWith('id', 'i1')
      expect(result.ok).toBe(true)
    })
  })

  // ── markRead ──

  describe('markRead', () => {
    it('upserts into guideline_reads with item_id (idempotent)', async () => {
      chain.upsert = vi.fn().mockResolvedValue({ data: null, error: null })

      const { markRead } = await import('./guidelines')
      const result = await markRead('item-1')

      expect(chain.from).toHaveBeenCalledWith('guideline_reads')
      expect(chain.upsert).toHaveBeenCalledWith({ item_id: 'item-1' })
      expect(result.ok).toBe(true)
    })

    it('returns error if upsert fails', async () => {
      chain.upsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error', code: 'UNKNOWN' },
      })

      const { markRead } = await import('./guidelines')
      const result = await markRead('item-1')

      expect(result.ok).toBe(false)
    })
  })

  // ── getUnreadCount ──

  describe('getUnreadCount', () => {
    it('queries guideline_items_full filtered by is_read=false', async () => {
      chain.then = vi.fn((resolve: any) =>
        Promise.resolve({ data: [{ id: '1' }, { id: '2' }], error: null }).then(resolve)
      )

      const { getUnreadCount } = await import('./guidelines')
      const result = await getUnreadCount()

      expect(chain.from).toHaveBeenCalledWith('guideline_items_full')
      expect(chain.eq).toHaveBeenCalledWith('is_read', false)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toBe(2)
    })

    it('applies sectionId filter when provided', async () => {
      chain.then = vi.fn((resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve)
      )

      const { getUnreadCount } = await import('./guidelines')
      await getUnreadCount('section-1')

      expect(chain.eq).toHaveBeenCalledWith('section_id', 'section-1')
    })
  })
})
