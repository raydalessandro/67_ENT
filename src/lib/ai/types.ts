export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiCompletionRequest {
  model: string
  messages: AiMessage[]
  temperature?: number
  max_tokens?: number
}

export interface AiCompletionResponse {
  content: string
  usage: { prompt_tokens: number; completion_tokens: number }
}

export interface AiProvider {
  name: string
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>
}

export interface AiProviderConfig {
  provider: string
  apiKey: string
  baseUrl?: string
}
