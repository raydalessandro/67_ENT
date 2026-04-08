import type { AiMessage } from './types'
import type { AiAgentConfig, AiChatMessage, PostWithDetails } from '@/types/models'

export interface AiContext {
  recentPosts?: PostWithDetails[]
  upcomingPosts?: PostWithDetails[]
  analyticsSummary?: string
}

export function buildSystemPrompt(config: AiAgentConfig, context?: AiContext): string {
  // STEP 1: Build sections from config fields with Italian headers
  const sections: string[] = []

  if (config.system_prompt_identity) {
    sections.push(`## Identità\n${config.system_prompt_identity}`)
  }
  if (config.system_prompt_activity) {
    sections.push(`## Attività\n${config.system_prompt_activity}`)
  }
  if (config.system_prompt_ontology) {
    sections.push(`## Ontologia\n${config.system_prompt_ontology}`)
  }
  if (config.system_prompt_marketing) {
    sections.push(`## Marketing\n${config.system_prompt_marketing}`)
  }
  if (config.system_prompt_boundaries) {
    sections.push(`## Confini\n${config.system_prompt_boundaries}`)
  }
  if (config.system_prompt_extra) {
    sections.push(`## Extra\n${config.system_prompt_extra}`)
  }

  // STEP 2: If context provided, add "## Dati Correnti" section
  if (context) {
    const contextParts: string[] = []

    if (context.recentPosts && context.recentPosts.length > 0) {
      const postLines = context.recentPosts.map(
        (p) =>
          `- ${p.title} (${p.status}, ${p.scheduled_date ?? p.created_at}) — ${p.artist_name}`
      )
      contextParts.push(`### Post recenti\n${postLines.join('\n')}`)
    }

    if (context.upcomingPosts && context.upcomingPosts.length > 0) {
      const postLines = context.upcomingPosts.map(
        (p) =>
          `- ${p.title} schedulato ${p.scheduled_date} — ${p.platforms.join(', ')}`
      )
      contextParts.push(`### Post in programma\n${postLines.join('\n')}`)
    }

    if (context.analyticsSummary) {
      contextParts.push(`### Analytics\n${context.analyticsSummary}`)
    }

    if (contextParts.length > 0) {
      sections.push(`## Dati Correnti\n${contextParts.join('\n\n')}`)
    }
  }

  return sections.join('\n\n')
}

export function buildMessages(
  systemPrompt: string,
  chatHistory: AiChatMessage[],
  newMessage: string,
  maxTokens: number = 4000
): AiMessage[] {
  // STEP 1: Calculate budget in chars (maxTokens * 4 chars per token)
  const budget = maxTokens * 4

  // STEP 2: Build system message
  const systemMessage: AiMessage = { role: 'system', content: systemPrompt }

  // STEP 3: Build the new user message
  const userMessage: AiMessage = { role: 'user', content: newMessage }

  // STEP 4: If system alone exceeds budget, return [system, user] only
  if (systemPrompt.length >= budget) {
    return [systemMessage, userMessage]
  }

  // STEP 5: Trim history oldest-first to fit within budget
  // Budget consumed by system + new user message
  let remainingBudget = budget - systemPrompt.length - newMessage.length

  // Convert chatHistory to AiMessage format (only user/assistant roles)
  const historyMessages: AiMessage[] = chatHistory
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Trim from oldest first — find how many from the end fit
  let startIndex = historyMessages.length
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const msgLen = historyMessages[i].content.length
    if (remainingBudget - msgLen >= 0) {
      remainingBudget -= msgLen
      startIndex = i
    } else {
      break
    }
  }

  const trimmedHistory = historyMessages.slice(startIndex)

  return [systemMessage, ...trimmedHistory, userMessage]
}
