import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildMessages } from './prompt-builder'
import type { AiAgentConfig, AiChatMessage, PostWithDetails } from '@/types/models'

// Minimal AiAgentConfig factory
function makeConfig(overrides: Partial<AiAgentConfig> = {}): AiAgentConfig {
  return {
    id: 'cfg-1',
    artist_id: 'artist-1',
    is_enabled: true,
    provider: 'openai',
    model_name: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 1000,
    daily_message_limit: 20,
    system_prompt_identity: '',
    system_prompt_activity: '',
    system_prompt_ontology: '',
    system_prompt_marketing: '',
    system_prompt_boundaries: '',
    system_prompt_extra: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// Minimal PostWithDetails factory
function makePost(overrides: Partial<PostWithDetails> = {}): PostWithDetails {
  return {
    id: 'post-1',
    artist_id: 'artist-1',
    title: 'Test Post',
    caption: null,
    hashtags: null,
    platforms: ['instagram_feed'],
    status: 'draft',
    scheduled_date: '2024-03-15',
    created_by: 'user-1',
    approved_by: null,
    rejection_reason: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    artist_name: 'Test Artist',
    artist_color: '#ff0000',
    media_count: 0,
    comment_count: 0,
    ...overrides,
  }
}

describe('buildSystemPrompt', () => {
  it('includes non-empty sections with Italian headers', () => {
    const config = makeConfig({
      system_prompt_identity: 'I am an assistant',
      system_prompt_activity: 'I help with posts',
    })
    const result = buildSystemPrompt(config)
    expect(result).toContain('## Identità')
    expect(result).toContain('I am an assistant')
    expect(result).toContain('## Attività')
    expect(result).toContain('I help with posts')
  })

  it('skips empty sections', () => {
    const config = makeConfig({ system_prompt_identity: 'Only identity' })
    const result = buildSystemPrompt(config)
    expect(result).toContain('## Identità')
    expect(result).not.toContain('## Attività')
    expect(result).not.toContain('## Ontologia')
    expect(result).not.toContain('## Marketing')
    expect(result).not.toContain('## Confini')
    expect(result).not.toContain('## Extra')
  })

  it('includes all 6 section headers when all fields are filled', () => {
    const config = makeConfig({
      system_prompt_identity: 'id',
      system_prompt_activity: 'act',
      system_prompt_ontology: 'ont',
      system_prompt_marketing: 'mkt',
      system_prompt_boundaries: 'bnd',
      system_prompt_extra: 'ext',
    })
    const result = buildSystemPrompt(config)
    expect(result).toContain('## Identità')
    expect(result).toContain('## Attività')
    expect(result).toContain('## Ontologia')
    expect(result).toContain('## Marketing')
    expect(result).toContain('## Confini')
    expect(result).toContain('## Extra')
  })

  it('returns empty string when all sections are empty', () => {
    const config = makeConfig()
    const result = buildSystemPrompt(config)
    expect(result).toBe('')
  })

  it('adds Dati Correnti section with recentPosts', () => {
    const config = makeConfig({ system_prompt_identity: 'id' })
    const post = makePost({ title: 'My Post', status: 'approved', scheduled_date: '2024-03-15', artist_name: 'DJ Max' })
    const result = buildSystemPrompt(config, { recentPosts: [post] })
    expect(result).toContain('## Dati Correnti')
    expect(result).toContain('### Post recenti')
    expect(result).toContain('My Post')
    expect(result).toContain('approved')
    expect(result).toContain('DJ Max')
  })

  it('adds Dati Correnti section with upcomingPosts', () => {
    const config = makeConfig({ system_prompt_identity: 'id' })
    const post = makePost({
      title: 'Upcoming',
      scheduled_date: '2024-04-01',
      platforms: ['instagram_reel', 'tiktok'],
    })
    const result = buildSystemPrompt(config, { upcomingPosts: [post] })
    expect(result).toContain('### Post in programma')
    expect(result).toContain('Upcoming')
    expect(result).toContain('schedulato 2024-04-01')
    expect(result).toContain('instagram_reel')
    expect(result).toContain('tiktok')
  })

  it('adds analytics summary', () => {
    const config = makeConfig({ system_prompt_identity: 'id' })
    const result = buildSystemPrompt(config, { analyticsSummary: '1000 followers, 5% engagement' })
    expect(result).toContain('### Analytics')
    expect(result).toContain('1000 followers, 5% engagement')
  })

  it('skips empty context fields', () => {
    const config = makeConfig({ system_prompt_identity: 'id' })
    const result = buildSystemPrompt(config, { recentPosts: [], upcomingPosts: [] })
    expect(result).not.toContain('## Dati Correnti')
  })

  it('does not add Dati Correnti section when context is undefined', () => {
    const config = makeConfig({ system_prompt_identity: 'id' })
    const result = buildSystemPrompt(config)
    expect(result).not.toContain('## Dati Correnti')
  })
})

describe('buildMessages', () => {
  it('returns [system, user] when no history', () => {
    const result = buildMessages('You are helpful.', [], 'Hello!')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ role: 'system', content: 'You are helpful.' })
    expect(result[1]).toEqual({ role: 'user', content: 'Hello!' })
  })

  it('includes history messages between system and user', () => {
    const history: AiChatMessage[] = [
      { id: '1', artist_id: 'a', user_id: 'u', role: 'user', content: 'First question', session_date: '2024-01-01', created_at: '2024-01-01T00:00:00Z' },
      { id: '2', artist_id: 'a', user_id: 'u', role: 'assistant', content: 'First answer', session_date: '2024-01-01', created_at: '2024-01-01T00:00:01Z' },
    ]
    const result = buildMessages('System', history, 'New message')
    expect(result[0].role).toBe('system')
    expect(result[1]).toEqual({ role: 'user', content: 'First question' })
    expect(result[2]).toEqual({ role: 'assistant', content: 'First answer' })
    expect(result[3]).toEqual({ role: 'user', content: 'New message' })
  })

  it('uses default maxTokens of 4000', () => {
    // With default 4000 tokens = 16000 chars budget, short messages should all fit
    const history: AiChatMessage[] = [
      { id: '1', artist_id: 'a', user_id: 'u', role: 'user', content: 'Hi', session_date: '2024-01-01', created_at: '2024-01-01T00:00:00Z' },
    ]
    const result = buildMessages('System', history, 'Hello')
    expect(result).toHaveLength(3)
  })

  it('trims oldest history messages when budget exceeded', () => {
    // Budget: 10 tokens * 4 = 40 chars
    // System = 6 chars, newMessage = 5 chars → 29 chars remaining
    // msg1 = 20 chars, msg2 = 20 chars — only one fits
    const system = 'System' // 6 chars
    const history: AiChatMessage[] = [
      { id: '1', artist_id: 'a', user_id: 'u', role: 'user', content: 'AAAAAAAAAAAAAAAAAAAA', session_date: '2024-01-01', created_at: '2024-01-01T00:00:00Z' }, // 20 chars
      { id: '2', artist_id: 'a', user_id: 'u', role: 'assistant', content: 'BBBBBBBBBBBBBBBBBBBB', session_date: '2024-01-01', created_at: '2024-01-01T00:00:01Z' }, // 20 chars
    ]
    const newMsg = 'Hello' // 5 chars
    const result = buildMessages(system, history, newMsg, 10)
    // System (6) + Hello (5) = 11 used, remaining 29
    // msg2 (20 chars) fits → included; msg1 (20 chars) would make 40+11>40 → trimmed
    expect(result.some((m) => m.content === 'AAAAAAAAAAAAAAAAAAAA')).toBe(false)
    expect(result.some((m) => m.content === 'BBBBBBBBBBBBBBBBBBBB')).toBe(true)
  })

  it('returns [system, user] only when system alone exceeds budget', () => {
    const longSystem = 'A'.repeat(1000)
    const history: AiChatMessage[] = [
      { id: '1', artist_id: 'a', user_id: 'u', role: 'user', content: 'Hi', session_date: '2024-01-01', created_at: '2024-01-01T00:00:00Z' },
    ]
    const result = buildMessages(longSystem, history, 'Hello', 10) // budget: 40 chars, system is 1000
    expect(result).toHaveLength(2)
    expect(result[0].role).toBe('system')
    expect(result[1].role).toBe('user')
  })
})
