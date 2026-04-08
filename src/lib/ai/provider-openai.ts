import type { AiProvider, AiProviderConfig, AiCompletionRequest, AiCompletionResponse } from './types'

export function createOpenAiProvider(config: AiProviderConfig): AiProvider {
  const baseUrl = config.baseUrl ?? 'https://api.openai.com/v1'

  return {
    name: 'openai',

    async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.max_tokens,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const json = await response.json()

      if (!json.choices || json.choices.length === 0) {
        throw new Error('OpenAI API returned empty choices')
      }

      return {
        content: json.choices[0].message.content,
        usage: {
          prompt_tokens: json.usage.prompt_tokens,
          completion_tokens: json.usage.completion_tokens,
        },
      }
    },
  }
}
