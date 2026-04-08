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
      // The columns list should contain the basic artist fields
      expect(selectArg).toContain('id')
      expect(selectArg).toContain('name')
      expect(selectArg).toContain('is_active')
      expect(chain.order).toHaveBeenCalledWith('name')
      expect(result.ok).toBe(true)
    })
  })

  // ── createArtist ──

  describe('createArtist', () => {
    it('calls create_artist_atomic RPC', async () => {
      const artist = { id: 'a1', name: 'Test Artist' }
      chain.rpc = vi.fn().mockResolvedValue({ data: artist, error: null })

      const { createArtist } = await import('./artists')
      const result = await createArtist({ name: 'Test Artist', email: 'test@test.com' })

      expect(chain.rpc).toHaveBeenCalledWith('create_artist_atomic', expect.objectContaining({
        name: 'Test Artist',
        email: 'test@test.com',
      }))
      expect(result.ok).toBe(true)
    })

    it('auto-generates password if not provided', async () => {
      const artist = { id: 'a1', name: 'Test Artist' }
      chain.rpc = vi.fn().mockResolvedValue({ data: artist, error: null })

      const { createArtist } = await import('./artists')
      await createArtist({ name: 'Test Artist', email: 'test@test.com' })

      const rpcPayload = chain.rpc.mock.calls[0][1]
      expect(rpcPayload.password).toBeDefined()
      expect(typeof rpcPayload.password).toBe('string')
      expect(rpcPayload.password.length).toBeGreaterThan(0)
    })

    it('uses provided password when given', async () => {
      const artist = { id: 'a1', name: 'Test Artist' }
      chain.rpc = vi.fn().mockResolvedValue({ data: artist, error: null })

      const { createArtist } = await import('./artists')
      await createArtist({ name: 'Test Artist', email: 'test@test.com', password: 'myPass123' })

      const rpcPayload = chain.rpc.mock.calls[0][1]
      expect(rpcPayload.password).toBe('myPass123')
    })
  })

  // ── updateArtist ──

  describe('updateArtist', () => {
    it('updates artists table by id with explicit column selection', async () => {
      const artist = { id: 'a1', name: 'Updated' }
      chain.single = vi.fn().mockResolvedValue({ data: artist, error: null })

      const { updateArtist } = await import('./artists')
      const result = await updateArtist('a1', { name: 'Updated' })

      expect(chain.from).toHaveBeenCalledWith('artists')
      expect(chain.update).toHaveBeenCalledWith({ name: 'Updated' })
      expect(chain.eq).toHaveBeenCalledWith('id', 'a1')
      const selectArg: string = chain.select.mock.calls[0][0]
      expect(selectArg).not.toContain('instagram_token_expires_at')
      expect(result.ok).toBe(true)
    })
  })

  // ── deactivateArtist ──

  describe('deactivateArtist', () => {
    it('calls deactivate_artist RPC with artist_id', async () => {
      chain.rpc = vi.fn().mockResolvedValue({ data: null, error: null })

      const { deactivateArtist } = await import('./artists')
      const result = await deactivateArtist('a1')

      expect(chain.rpc).toHaveBeenCalledWith('deactivate_artist', { artist_id: 'a1' })
      expect(result.ok).toBe(true)
    })

    it('returns error when RPC fails', async () => {
      chain.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'fail', code: 'UNKNOWN' },
      })

      const { deactivateArtist } = await import('./artists')
      const result = await deactivateArtist('a1')

      expect(result.ok).toBe(false)
    })
  })

  // ── resetPassword ──

  describe('resetPassword', () => {
    it('calls reset_user_password RPC with target_user_id and new_password', async () => {
      chain.rpc = vi.fn().mockResolvedValue({ data: null, error: null })

      const { resetPassword } = await import('./artists')
      const result = await resetPassword('user-1', 'newPass!')

      expect(chain.rpc).toHaveBeenCalledWith('reset_user_password', {
        target_user_id: 'user-1',
        new_password: 'newPass!',
      })
      expect(result.ok).toBe(true)
    })
  })
})
