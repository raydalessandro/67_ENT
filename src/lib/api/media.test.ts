import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBrowserClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(),
}))

function createMockSupabase() {
  const storage = {
    from: vi.fn(),
  }

  const dbChain: any = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  const mock = {
    ...dbChain,
    storage,
  }

  return { mock, dbChain, storage }
}

describe('media.ts', () => {
  let mock: any
  let dbChain: any
  let storage: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    const created = createMockSupabase()
    mock = created.mock
    dbChain = created.dbChain
    storage = created.storage
    ;(createBrowserClient as any).mockReturnValue(mock)
  })

  // ── getMediaUrl ──

  describe('getMediaUrl', () => {
    it('returns the public URL for a given path', async () => {
      storage.from.mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/post-media/posts/p1/img.jpg' },
        }),
      })

      const { getMediaUrl } = await import('./media')
      const url = getMediaUrl('posts/p1/img.jpg')

      expect(storage.from).toHaveBeenCalledWith('post-media')
      expect(url).toBe('https://storage.example.com/post-media/posts/p1/img.jpg')
    })

    it('calls storage.from with post-media bucket', async () => {
      storage.from.mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/any' },
        }),
      })

      const { getMediaUrl } = await import('./media')
      getMediaUrl('any/path')

      expect(storage.from).toHaveBeenCalledWith('post-media')
    })
  })

  // ── uploadMedia ──

  describe('uploadMedia', () => {
    it('uploads file to storage and inserts DB row on success', async () => {
      const file = new File(['data'], 'photo.png', { type: 'image/png', lastModified: Date.now() })
      Object.defineProperty(file, 'size', { value: 1024 })

      storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/post-media/posts/p1/123-0.png' },
        }),
      })

      const mediaRow = {
        id: 'm1',
        post_id: 'p1',
        file_url: 'https://storage.example.com/post-media/posts/p1/123-0.png',
        file_type: 'image',
        file_size: 1024,
        display_order: 0,
        thumbnail_url: null,
        created_at: '2025-01-01T00:00:00Z',
      }
      dbChain.single.mockResolvedValue({ data: mediaRow, error: null })

      const { uploadMedia } = await import('./media')
      const result = await uploadMedia('p1', file, 0)

      expect(storage.from).toHaveBeenCalledWith('post-media')
      expect(dbChain.from).toHaveBeenCalledWith('post_media')
      expect(dbChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          post_id: 'p1',
          file_type: 'image',
          file_size: 1024,
          display_order: 0,
        })
      )
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual(mediaRow)
      }
    })

    it('detects video file type from MIME', async () => {
      const file = new File(['data'], 'clip.mp4', { type: 'video/mp4', lastModified: Date.now() })

      storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/post-media/posts/p1/123-0.mp4' },
        }),
      })

      const mediaRow = {
        id: 'm1',
        post_id: 'p1',
        file_url: 'https://storage.example.com/post-media/posts/p1/123-0.mp4',
        file_type: 'video',
        file_size: 2048,
        display_order: 1,
        thumbnail_url: null,
        created_at: '2025-01-01T00:00:00Z',
      }
      dbChain.single.mockResolvedValue({ data: mediaRow, error: null })

      const { uploadMedia } = await import('./media')
      const result = await uploadMedia('p1', file, 1)

      expect(dbChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ file_type: 'video' })
      )
      expect(result.ok).toBe(true)
    })

    it('returns STORAGE_ERROR when storage upload fails', async () => {
      const file = new File(['data'], 'photo.png', { type: 'image/png' })

      storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: { message: 'Bucket full' } }),
      })

      const { uploadMedia } = await import('./media')
      const result = await uploadMedia('p1', file, 0)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('STORAGE_ERROR')
        expect(result.error.message).toBe('Bucket full')
      }
    })

    it('returns UNKNOWN error when DB insert fails', async () => {
      const file = new File(['data'], 'photo.png', { type: 'image/png' })

      storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/img.png' },
        }),
      })

      dbChain.single.mockResolvedValue({
        data: null,
        error: { message: 'unique violation', code: '23505' },
      })

      const { uploadMedia } = await import('./media')
      const result = await uploadMedia('p1', file, 0)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('UNKNOWN')
      }
    })

    it('derives file extension from filename', async () => {
      const file = new File(['data'], 'image.webp', { type: 'image/webp' })

      const uploadMock = vi.fn().mockResolvedValue({ error: null })
      storage.from.mockReturnValue({
        upload: uploadMock,
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/img.webp' },
        }),
      })

      dbChain.single.mockResolvedValue({
        data: { id: 'm1' },
        error: null,
      })

      const { uploadMedia } = await import('./media')
      await uploadMedia('p1', file, 0)

      const uploadedPath = uploadMock.mock.calls[0][0] as string
      expect(uploadedPath).toMatch(/\.webp$/)
      expect(uploadedPath).toMatch(/^posts\/p1\//)
    })
  })

  // ── deleteMedia ──

  describe('deleteMedia', () => {
    it('removes file from storage and deletes DB row on success', async () => {
      const removeMock = vi.fn().mockResolvedValue({ error: null })
      storage.from.mockReturnValue({ remove: removeMock })

      // delete().eq() chain for DB
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      dbChain.delete.mockReturnValue({ eq: eqMock })

      const { deleteMedia } = await import('./media')
      const result = await deleteMedia('m1', 'posts/p1/123-0.png')

      expect(storage.from).toHaveBeenCalledWith('post-media')
      expect(removeMock).toHaveBeenCalledWith(['posts/p1/123-0.png'])
      expect(dbChain.from).toHaveBeenCalledWith('post_media')
      expect(eqMock).toHaveBeenCalledWith('id', 'm1')
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toBeUndefined()
      }
    })

    it('returns STORAGE_ERROR when storage remove fails', async () => {
      storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: { message: 'File not found in bucket' } }),
      })

      const { deleteMedia } = await import('./media')
      const result = await deleteMedia('m1', 'posts/p1/123-0.png')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('STORAGE_ERROR')
        expect(result.error.message).toBe('File not found in bucket')
      }
    })

    it('returns mapped error when DB delete fails', async () => {
      storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      })

      const eqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'permission denied', code: '42501' },
      })
      dbChain.delete.mockReturnValue({ eq: eqMock })

      const { deleteMedia } = await import('./media')
      const result = await deleteMedia('m1', 'posts/p1/123-0.png')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED')
      }
    })
  })
})
