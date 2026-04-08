import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MediaUploader } from './media-uploader'
import type { PostMedia } from '@/types/models'

function makeMedia(overrides: Partial<PostMedia> = {}): PostMedia {
  return {
    id: 'm1',
    post_id: 'p1',
    file_url: 'https://storage.example.com/post-media/posts/p1/img.jpg',
    file_type: 'image',
    file_size: 1024,
    display_order: 0,
    thumbnail_url: null,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('MediaUploader', () => {
  const defaultProps = {
    postId: 'p1',
    media: [] as PostMedia[],
    onUpload: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Render ──

  it('renders upload drop zone with instructional text', () => {
    render(<MediaUploader {...defaultProps} />)

    expect(screen.getByText(/trascina file qui/i)).toBeInTheDocument()
    expect(screen.getByText(/clicca per caricare/i)).toBeInTheDocument()
    expect(screen.getByText(/immagini e video supportati/i)).toBeInTheDocument()
  })

  it('renders a hidden file input', () => {
    const { container } = render(<MediaUploader {...defaultProps} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.accept).toBe('image/*,video/*')
    expect(input.multiple).toBe(true)
    expect(input).toHaveClass('hidden')
  })

  // ── File selection ──

  it('calls onUpload when a file is selected via input', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const { container } = render(
      <MediaUploader {...defaultProps} onUpload={onUpload} />
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pixels'], 'photo.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(file, 0)
    })
  })

  it('passes correct order based on existing media count', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const existingMedia = [makeMedia({ id: 'm1', display_order: 0 })]
    const { container } = render(
      <MediaUploader {...defaultProps} media={existingMedia} onUpload={onUpload} />
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pixels'], 'photo2.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(file, 1)
    })
  })

  // ── Media thumbnails ──

  it('displays image thumbnails for existing media', () => {
    const media = [
      makeMedia({ id: 'm1', file_url: 'https://example.com/img1.jpg' }),
      makeMedia({ id: 'm2', file_url: 'https://example.com/img2.jpg', display_order: 1 }),
    ]

    render(<MediaUploader {...defaultProps} media={media} />)

    const images = screen.getAllByAltText('Media')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/img1.jpg')
    expect(images[1]).toHaveAttribute('src', 'https://example.com/img2.jpg')
  })

  it('uses thumbnail_url when available', () => {
    const media = [
      makeMedia({
        id: 'm1',
        file_url: 'https://example.com/full.jpg',
        thumbnail_url: 'https://example.com/thumb.jpg',
      }),
    ]

    render(<MediaUploader {...defaultProps} media={media} />)

    const img = screen.getByAltText('Media')
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
  })

  it('renders video element for video media', () => {
    const media = [
      makeMedia({ id: 'm1', file_type: 'video', file_url: 'https://example.com/clip.mp4' }),
    ]

    const { container } = render(<MediaUploader {...defaultProps} media={media} />)

    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video?.src).toBe('https://example.com/clip.mp4')
  })

  it('shows VIDEO label on video thumbnails', () => {
    const media = [
      makeMedia({ id: 'm1', file_type: 'video' }),
    ]

    render(<MediaUploader {...defaultProps} media={media} />)

    expect(screen.getByText('VIDEO')).toBeInTheDocument()
  })

  it('does not render thumbnail grid when media is empty', () => {
    const { container } = render(<MediaUploader {...defaultProps} media={[]} />)

    expect(container.querySelector('.grid')).not.toBeInTheDocument()
  })

  // ── Delete ──

  it('calls onDelete with mediaId and extracted path when delete button is clicked', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    const media = [
      makeMedia({
        id: 'm1',
        file_url: 'https://storage.example.com/storage/v1/object/public/post-media/posts/p1/123-0.jpg',
      }),
    ]

    render(<MediaUploader {...defaultProps} media={media} onDelete={onDelete} />)

    const deleteButton = screen.getByTitle('Elimina')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('m1', 'posts/p1/123-0.jpg')
    })
  })

  // ── Disabled state ──

  it('disables file input when disabled prop is true', () => {
    const { container } = render(
      <MediaUploader {...defaultProps} disabled />
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it('does not show delete buttons when disabled', () => {
    const media = [makeMedia()]

    render(<MediaUploader {...defaultProps} media={media} disabled />)

    expect(screen.queryByTitle('Elimina')).not.toBeInTheDocument()
  })

  it('does not call onUpload when disabled and file is selected', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const { container } = render(
      <MediaUploader {...defaultProps} onUpload={onUpload} disabled />
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pixels'], 'photo.png', { type: 'image/png' })

    // Even though the input is disabled, fireEvent.change will still fire;
    // the component guards against it with the disabled check in handleFiles
    fireEvent.change(input, { target: { files: [file] } })

    // Give time for any async to settle
    await new Promise((r) => setTimeout(r, 50))
    expect(onUpload).not.toHaveBeenCalled()
  })

  // ── Drag & drop ──

  it('applies dragging style on dragOver and removes on dragLeave', () => {
    const { container } = render(<MediaUploader {...defaultProps} />)

    const dropZone = container.querySelector('[class*="border-dashed"]')!
    expect(dropZone).toBeInTheDocument()

    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })
    expect(dropZone.className).toContain('border-[#F5C518]')

    fireEvent.dragLeave(dropZone)
    expect(dropZone.className).toContain('border-[#1E1E30]')
  })

  it('calls onUpload when files are dropped', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const { container } = render(
      <MediaUploader {...defaultProps} onUpload={onUpload} />
    )

    const dropZone = container.querySelector('[class*="border-dashed"]')!
    const file = new File(['pixels'], 'dropped.jpg', { type: 'image/jpeg' })

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(file, 0)
    })
  })
})
