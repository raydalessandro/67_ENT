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
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  chain.then = vi.fn((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve)
  )
  return chain
}

describe('artists.ts', () => {
  let chain: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    chain = createMockSupabase()
    ;(createBrowserClient as any).mockReturnValue(chain)
  })

  // ── getArtists ──

  describe('getArtists', () => {
    it('queries artists table with explicit columns excluding instagram_token fields', async () => {
      chain.then = vi.fn((resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve)
      )

      const { getArtists } = await import('./artists')
      const result = await getArtists()

      expect(chain.from).toHaveBeenCalledWith('artists')
      const selectArg: string = chain.select.mock.calls[0][0]
      expect(selectArg).not.toContain('instagram_token_expires_at')
      expect(selectArg).toContain('id')
      expect(selectArg).toContain('name')
      expect(selectArg).toContain('is_active')
      expect(chain.order).toHaveBeenCalledWith('name')
      expect(result.ok).toBe(true)
    })
  })

  // ── createArtist ──

  describe('createArtist', () => {
    it('calls POST /api/artists and returns artist with password', async () => {
      const artist = { id: 'a1', name: 'Test Artist' }
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ artist, password: 'gen123' }), { status: 201 })
      )

      const { createArtist } = await import('./artists')
      const result = await createArtist({ name: 'Test Artist', email: 'test@test.com' })

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/artists', expect.objectContaining({
        method: 'POST',
      }))
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.name).toBe('Test Artist')
        expect(result.data.password).toBe('gen123')
      }
    })

    it('returns error on API failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error: 'Email già in uso' }), { status: 400 })
      )

      const { createArtist } = await import('./artists')
      const result = await createArtist({ name: 'Test', email: 'dup@test.com' })

      expect(result.ok).toBe(false)
    })

    it('returns network error on fetch failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network down'))

      const { createArtist } = await import('./artists')
      const result = await createArtist({ name: 'Test', email: 'test@test.com' })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('NETWORK_ERROR')
      }
    })
  })

  // ── updateArtist ──

  describe('updateArtist', () => {
    it('calls PATCH /api/artists/[id] and returns updated artist', async () => {
      const artist = { id: 'a1', name: 'Updated' }
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ artist }), { status: 200 })
      )

      const { updateArtist } = await import('./artists')
      const result = await updateArtist('a1', { name: 'Updated' })

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/artists/a1', expect.objectContaining({
        method: 'PATCH',
      }))
      expect(result.ok).toBe(true)
    })
  })

  // ── deactivateArtist ──

  describe('deactivateArtist', () => {
    it('calls updateArtist with is_active: false', async () => {
      const artist = { id: 'a1', is_active: false }
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ artist }), { status: 200 })
      )

      const { deactivateArtist } = await import('./artists')
      const result = await deactivateArtist('a1')

      const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body)
      expect(body.is_active).toBe(false)
      expect(result.ok).toBe(true)
    })
  })

  // ── resetPassword ──

  describe('resetPassword', () => {
    it('calls POST /api/artists/[id] with password', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      const { resetPassword } = await import('./artists')
      const result = await resetPassword('a1', 'newPass!')

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/artists/a1', expect.objectContaining({
        method: 'POST',
      }))
      const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body)
      expect(body.password).toBe('newPass!')
      expect(result.ok).toBe(true)
    })
  })
})
