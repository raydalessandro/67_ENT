import type { AiProvider, AiProviderConfig } from './types'
import { createOpenAiProvider } from './provider-openai'
import { createAnthropicProvider } from './provider-anthropic'

export const PROVIDER_REGISTRY: Record<string, (config: AiProviderConfig) => AiProvider> = {
  openai: createOpenAiProvider,
  anthropic: createAnthropicProvider,
}

export function getProvider(config: AiProviderConfig): AiProvider {
  const factory = PROVIDER_REGISTRY[config.provider]
  if (!factory) {
    throw new Error(`Unknown AI provider: "${config.provider}". Available providers: ${Object.keys(PROVIDER_REGISTRY).join(', ')}`)
  }
  return factory(config)
}
