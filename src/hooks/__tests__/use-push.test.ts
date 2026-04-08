import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePush } from '../use-push'

// Mock the notifications API
vi.mock('@/lib/api/notifications', () => ({
  registerPushSubscription: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
  unregisterPushSubscription: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
}))

function createMockPushSubscription(endpoint = 'https://push.example.com/sub1') {
  return {
    endpoint,
    toJSON: () => ({
      endpoint,
      keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  }
}

function createMockPushManager(existing: ReturnType<typeof createMockPushSubscription> | null = null) {
  return {
    getSubscription: vi.fn().mockResolvedValue(existing),
    subscribe: vi.fn().mockResolvedValue(createMockPushSubscription()),
  }
}

function createMockRegistration(pushManager = createMockPushManager()) {
  return {
    pushManager,
    scope: '/',
    active: {},
  }
}

// Save originals
const originalNavigator = globalThis.navigator
const originalWindow = globalThis.window
const originalNotification = globalThis.Notification

describe('usePush', () => {
  let mockRegistration: ReturnType<typeof createMockRegistration>

  beforeEach(() => {
    localStorage.clear()
    mockRegistration = createMockRegistration()

    // Mock serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        ready: Promise.resolve(mockRegistration),
      },
      configurable: true,
    })

    // Mock PushManager on window
    Object.defineProperty(window, 'PushManager', {
      value: class {},
      configurable: true,
    })

    // Mock Notification
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') },
      configurable: true,
      writable: true,
    })

    // Set VAPID key
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'BDd3_hVL9fZi9Ybo2UUzA284WG5FZR30_95YeZJsiApwXKpNcF1rRPF3foIiBHXRdJI2Qhumhf6_LFTeZaNndIo')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns unsupported when serviceWorker is not in navigator', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    })

    const { result } = renderHook(() => usePush())
    expect(result.current.permission).toBe('unsupported')
    expect(result.current.isSubscribed).toBe(false)
  })

  it('returns default permission when Notification.permission is default', () => {
    const { result } = renderHook(() => usePush())
    expect(result.current.permission).toBe('default')
  })

  it('returns granted permission when Notification.permission is granted', () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      configurable: true,
      writable: true,
    })

    const { result } = renderHook(() => usePush())
    expect(result.current.permission).toBe('granted')
  })

  it('returns denied permission when Notification.permission is denied', () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'denied', requestPermission: vi.fn() },
      configurable: true,
      writable: true,
    })

    const { result } = renderHook(() => usePush())
    expect(result.current.permission).toBe('denied')
  })

  it('detects existing subscription on mount', async () => {
    const existingSub = createMockPushSubscription()
    const pushManager = createMockPushManager(existingSub as any)
    mockRegistration = createMockRegistration(pushManager as any)

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        ready: Promise.resolve(mockRegistration),
      },
      configurable: true,
    })

    const { result } = renderHook(() => usePush())

    // Wait for the async init in useEffect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    expect(result.current.isSubscribed).toBe(true)
  })

  it('subscribe requests permission and registers subscription', async () => {
    const { registerPushSubscription } = await import('@/lib/api/notifications')

    const { result } = renderHook(() => usePush())

    // Wait for the async init in useEffect to settle first
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    await act(async () => {
      await result.current.subscribe()
    })

    expect(Notification.requestPermission).toHaveBeenCalled()
    expect(mockRegistration.pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    })
    expect(registerPushSubscription).toHaveBeenCalledWith({
      endpoint: 'https://push.example.com/sub1',
      keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' },
      userAgent: navigator.userAgent,
    })
    expect(result.current.isSubscribed).toBe(true)
    expect(result.current.permission).toBe('granted')
  })

  it('subscribe does not register if permission denied', async () => {
    ;(Notification.requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue('denied')

    const { result } = renderHook(() => usePush())

    // Wait for the async init in useEffect to settle first
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    await act(async () => {
      await result.current.subscribe()
    })

    expect(result.current.isSubscribed).toBe(false)
    expect(result.current.permission).toBe('denied')
  })

  it('unsubscribe removes subscription and calls API', async () => {
    const existingSub = createMockPushSubscription()
    const pushManager = createMockPushManager(existingSub as any)
    mockRegistration = createMockRegistration(pushManager as any)

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        ready: Promise.resolve(mockRegistration),
      },
      configurable: true,
    })

    const { unregisterPushSubscription } = await import('@/lib/api/notifications')
    const { result } = renderHook(() => usePush())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    await act(async () => {
      await result.current.unsubscribe()
    })

    expect(existingSub.unsubscribe).toHaveBeenCalled()
    expect(unregisterPushSubscription).toHaveBeenCalledWith('https://push.example.com/sub1')
    expect(result.current.isSubscribed).toBe(false)
  })

  it('dismiss sets localStorage and isDismissed', () => {
    const { result } = renderHook(() => usePush())

    expect(result.current.isDismissed).toBe(false)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.isDismissed).toBe(true)
    expect(localStorage.getItem('push-dismissed')).toBe('true')
  })

  it('reads isDismissed from localStorage on mount', () => {
    localStorage.setItem('push-dismissed', 'true')

    const { result } = renderHook(() => usePush())
    expect(result.current.isDismissed).toBe(true)
  })
})
