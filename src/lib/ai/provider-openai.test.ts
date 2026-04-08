import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createOpenAiProvider } from './provider-openai'
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
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello' }],
    temperature: 0.7,
    max_tokens: 500,
    ...overrides,
  }
}

function makeOpenAiResponse(content: string = 'Test response') {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    }),
  }
}

describe('createOpenAiProvider', () => {
  it('has name "openai"', () => {
    const provider = createOpenAiProvider({ provider: 'openai', apiKey: 'test-key' })
    expect(provider.name).toBe('openai')
  })

  it('POSTs to default baseUrl /chat/completions', async () => {
    mockFetch.mockResolvedValueOnce(makeOpenAiResponse())
    const provider = createOpenAiProvider({ provider: 'openai', apiKey: 'sk-test' })
    await provider.complete(makeRequest())
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('uses custom baseUrl when provided', async () => {
    mockFetch.mockResolvedValueOnce(makeOpenAiResponse())
    const provider = createOpenAiProvider({
      provider: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'https://custom.openai.com/v1',
    })
    await provider.complete(makeRequest())
    expect(mockFetch).toHaveBeenCalledWith(
      'https://custom.openai.com/v1/chat/completions',
      expect.anything()
    )
  })

  it('sends Authorization header with Bearer token', async () => {
    mockFetch.mockResolvedValueOnce(makeOpenAiResponse())
    const provider = createOpenAiProvider({ provider: 'openai', apiKey: 'sk-mykey' })
    await provider.complete(makeRequest())
    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers['Authorization']).toBe('Bearer sk-mykey')
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  it('sends correct body with model, messages, temperature, max_tokens', async () => {
    mockFetch.mockResolvedValueOnce(makeOpenAiResponse())
    const provider = createOpenAiProvider({ provider: 'openai', apiKey: 'sk-test' })
    const request = makeRequest({ model: 'gpt-4o-mini', temperature: 0.5, max_tokens: 200 })
    await provider.complete(request)
    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.model).toBe('gpt-4o-mini')
    expect(body.messages).toEqual(request.messages)
    expect(body.temperature).toBe(0.5)
    expect(body.max_tokens).toBe(200)
  })

  it('returns content and usage from response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello world' } }],
        usage: { prompt_tokens: 15, completion_tokens: 25 },
      }),
    })
    const provider = createOpenAiProvider({ provider: 'openai', apiKey: 'sk-test' })
    const result = await provider.complete(makeRequest())
    expect(result.content).toBe('Hello world')
    expect(result.usage.prompt_tokens).toBe(15)
    expect(result.usage.completion_tokens).toBe(25)
  })

  it('throws on non-2xx response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized' })
    const provider = createOpenAiProvider({ provider: 'openai', apiKey: 'bad-key' })
    await expect(provider.complete(makeRequest())).rejects.toThrow('401')
  })

  it('throws when choices array is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [], usage: { prompt_tokens: 5, completion_tokens: 0 } }),
    })
    const provider = createOpenAiProvider({ provider: 'openai', apiKey: 'sk-test' })
    await expect(provider.complete(makeRequest())).rejects.toThrow()
  })
})
