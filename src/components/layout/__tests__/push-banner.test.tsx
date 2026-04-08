import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PushBanner } from '../push-banner'

// Mock the usePush hook
const mockSubscribe = vi.fn()
const mockDismiss = vi.fn()

const defaultHookReturn = {
  permission: 'default' as const,
  isSubscribed: false,
  isLoading: false,
  subscribe: mockSubscribe,
  unsubscribe: vi.fn(),
  dismiss: mockDismiss,
  isDismissed: false,
}

vi.mock('@/hooks/use-push', () => ({
  usePush: vi.fn(() => defaultHookReturn),
}))

import { usePush } from '@/hooks/use-push'
const mockedUsePush = vi.mocked(usePush)

describe('PushBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUsePush.mockReturnValue(defaultHookReturn)
  })

  it('renders banner when permission is default and not dismissed', () => {
    render(<PushBanner />)

    expect(
      screen.getByText('Attiva le notifiche push per ricevere aggiornamenti sui tuoi post')
    ).toBeInTheDocument()
    expect(screen.getByText('Attiva')).toBeInTheDocument()
  })

  it('returns null when permission is granted', () => {
    mockedUsePush.mockReturnValue({ ...defaultHookReturn, permission: 'granted' })

    const { container } = render(<PushBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when permission is denied', () => {
    mockedUsePush.mockReturnValue({ ...defaultHookReturn, permission: 'denied' })

    const { container } = render(<PushBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when permission is unsupported', () => {
    mockedUsePush.mockReturnValue({ ...defaultHookReturn, permission: 'unsupported' })

    const { container } = render(<PushBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when isDismissed is true', () => {
    mockedUsePush.mockReturnValue({ ...defaultHookReturn, isDismissed: true })

    const { container } = render(<PushBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when isSubscribed is true', () => {
    mockedUsePush.mockReturnValue({ ...defaultHookReturn, isSubscribed: true })

    const { container } = render(<PushBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('calls subscribe when Attiva button is clicked', async () => {
    const user = userEvent.setup()
    render(<PushBanner />)

    await user.click(screen.getByText('Attiva'))
    expect(mockSubscribe).toHaveBeenCalledOnce()
  })

  it('calls dismiss when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<PushBanner />)

    await user.click(screen.getByLabelText('Chiudi'))
    expect(mockDismiss).toHaveBeenCalledOnce()
  })

  it('disables Attiva button when isLoading is true', () => {
    mockedUsePush.mockReturnValue({ ...defaultHookReturn, isLoading: true })
    render(<PushBanner />)

    expect(screen.getByText('Attiva')).toBeDisabled()
  })
})
