import { describe, it, expect } from 'vitest'
import { PROVIDER_REGISTRY, getProvider } from './router'

describe('PROVIDER_REGISTRY', () => {
  it('contains openai entry', () => {
    expect(PROVIDER_REGISTRY['openai']).toBeDefined()
    expect(typeof PROVIDER_REGISTRY['openai']).toBe('function')
  })

  it('contains anthropic entry', () => {
    expect(PROVIDER_REGISTRY['anthropic']).toBeDefined()
    expect(typeof PROVIDER_REGISTRY['anthropic']).toBe('function')
  })

  it('openai factory returns provider with name "openai"', () => {
    const provider = PROVIDER_REGISTRY['openai']({ provider: 'openai', apiKey: 'test' })
    expect(provider.name).toBe('openai')
  })

  it('anthropic factory returns provider with name "anthropic"', () => {
    const provider = PROVIDER_REGISTRY['anthropic']({ provider: 'anthropic', apiKey: 'test' })
    expect(provider.name).toBe('anthropic')
  })
})

describe('getProvider', () => {
  it('returns openai provider for config.provider = "openai"', () => {
    const provider = getProvider({ provider: 'openai', apiKey: 'sk-test' })
    expect(provider.name).toBe('openai')
    expect(typeof provider.complete).toBe('function')
  })

  it('returns anthropic provider for config.provider = "anthropic"', () => {
    const provider = getProvider({ provider: 'anthropic', apiKey: 'sk-ant-test' })
    expect(provider.name).toBe('anthropic')
    expect(typeof provider.complete).toBe('function')
  })

  it('throws for unknown provider', () => {
    expect(() => getProvider({ provider: 'gemini', apiKey: 'key' })).toThrow()
  })

  it('throw message mentions the unknown provider name', () => {
    expect(() => getProvider({ provider: 'unknown-llm', apiKey: 'key' })).toThrow('unknown-llm')
  })
})
