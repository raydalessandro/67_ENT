import type { AiProvider, AiProviderConfig, AiCompletionRequest, AiCompletionResponse, AiMessage } from './types'

export function createAnthropicProvider(config: AiProviderConfig): AiProvider {
  return {
    name: 'anthropic',

    async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
      // Separate system message from conversation messages
      // Anthropic requires system as a top-level field, not in the messages array
      let systemPrompt: string | undefined
      const conversationMessages: AiMessage[] = []

      for (const msg of request.messages) {
        if (msg.role === 'system') {
          systemPrompt = msg.content
        } else {
          conversationMessages.push(msg)
        }
      }

      const body: Record<string, unknown> = {
        model: request.model,
        messages: conversationMessages,
        max_tokens: request.max_tokens ?? 2000,
      }

      if (systemPrompt !== undefined) {
        body.system = systemPrompt
      }

      if (request.temperature !== undefined) {
        body.temperature = request.temperature
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
      }

      const json = await response.json()

      if (!json.content || json.content.length === 0) {
        throw new Error('Anthropic API returned empty content')
      }

      return {
        content: json.content[0].text,
        usage: {
          prompt_tokens: json.usage.input_tokens,
          completion_tokens: json.usage.output_tokens,
        },
      }
    },
  }
}
