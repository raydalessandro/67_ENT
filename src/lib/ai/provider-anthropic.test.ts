import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAnthropicProvider } from './provider-anthropic'
import type { AiCompletionRequest } from './types'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function makeRequest(overrides: Partial<AiCompletionRequest> = {}): AiCompletionRequest {
  return {
    model: 'claude-3-5-sonnet-20241022',
    messages: [
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ],
    temperature: 0.7,
    max_tokens: 500,
    ...overrides,
  }
}

function makeAnthropicResponse(text: string = 'Test response') {
  return {
    ok: true,
    json: async () => ({
      content: [{ text }],
      usage: { input_tokens: 10, output_tokens: 20 },
    }),
  }
}

describe('createAnthropicProvider', () => {
  it('has name "anthropic"', () => {
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'test-key' })
    expect(provider.name).toBe('anthropic')
  })

  it('POSTs to https://api.anthropic.com/v1/messages', async () => {
    mockFetch.mockResolvedValueOnce(makeAnthropicResponse())
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'test-key' })
    await provider.complete(makeRequest())
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('sends x-api-key, anthropic-version, Content-Type headers', async () => {
    mockFetch.mockResolvedValueOnce(makeAnthropicResponse())
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'sk-ant-test' })
    await provider.complete(makeRequest())
    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers['x-api-key']).toBe('sk-ant-test')
    expect(options.headers['anthropic-version']).toBe('2023-06-01')
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  it('separates system message from conversation messages', async () => {
    mockFetch.mockResolvedValueOnce(makeAnthropicResponse())
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'sk-test' })
    await provider.complete(makeRequest())
    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    // system should be top-level, not in messages
    expect(body.system).toBe('You are helpful.')
    expect(body.messages).not.toContainEqual(expect.objectContaining({ role: 'system' }))
  })

  it('includes only user/assistant messages in messages array', async () => {
    mockFetch.mockResolvedValueOnce(makeAnthropicResponse())
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'sk-test' })
    await provider.complete(makeRequest())
    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.messages).toEqual([{ role: 'user', content: 'Hello' }])
  })

  it('uses max_tokens from request, defaulting to 2000', async () => {
    mockFetch.mockResolvedValueOnce(makeAnthropicResponse())
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'sk-test' })
    // Without max_tokens specified
    await provider.complete(makeRequest({ max_tokens: undefined }))
    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.max_tokens).toBe(2000)
  })

  it('passes max_tokens from request when provided', async () => {
    mockFetch.mockResolvedValueOnce(makeAnthropicResponse())
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'sk-test' })
    await provider.complete(makeRequest({ max_tokens: 800 }))
    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.max_tokens).toBe(800)
  })

  it('maps input_tokens → prompt_tokens, output_tokens → completion_tokens', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'Hello!' }],
        usage: { input_tokens: 30, output_tokens: 50 },
      }),
    })
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'sk-test' })
    const result = await provider.complete(makeRequest())
    expect(result.usage.prompt_tokens).toBe(30)
    expect(result.usage.completion_tokens).toBe(50)
  })

  it('returns content from json.content[0].text', async () => {
    mockFetch.mockResolvedValueOnce(makeAnthropicResponse('Great answer!'))
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'sk-test' })
    const result = await provider.complete(makeRequest())
    expect(result.content).toBe('Great answer!')
  })

  it('throws on non-2xx response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, statusText: 'Forbidden' })
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'bad-key' })
    await expect(provider.complete(makeRequest())).rejects.toThrow('403')
  })

  it('throws when content array is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [], usage: { input_tokens: 5, output_tokens: 0 } }),
    })
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'sk-test' })
    await expect(provider.complete(makeRequest())).rejects.toThrow()
  })

  it('does not include system in body when no system message', async () => {
    mockFetch.mockResolvedValueOnce(makeAnthropicResponse())
    const provider = createAnthropicProvider({ provider: 'anthropic', apiKey: 'sk-test' })
    await provider.complete(makeRequest({
      messages: [{ role: 'user', content: 'No system here' }],
    }))
    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.system).toBeUndefined()
  })
})
