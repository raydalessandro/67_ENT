import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { buildSystemPrompt, buildMessages } from '@/lib/ai/prompt-builder'
import type { AiContext } from '@/lib/ai/prompt-builder'
import { getProvider } from '@/lib/ai/router'

export async function POST(req: NextRequest) {
  // STEP 1: Parse body → { message: string }. Validate non-empty. → 400
  let body: { message?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const message = body.message
  if (typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'message is required and must be a non-empty string' }, { status: 400 })
  }

  // STEP 2: Auth → createServerClient(cookies) → getUser(). → 401
  const supabase = createServerClient(cookies)
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // STEP 3: Resolve artist → artists WHERE user_id = authUser.id. → 404/403
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('id, user_id')
    .eq('user_id', authUser.id)
    .single()

  if (artistError || !artist) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
  }

  if (artist.user_id !== authUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // STEP 4: Load AI config → ai_agent_configs WHERE artist_id. → 404/403 if disabled
  const { data: config, error: configError } = await supabase
    .from('ai_agent_configs')
    .select('*')
    .eq('artist_id', artist.id)
    .single()

  if (configError || !config) {
    return NextResponse.json({ error: 'AI config not found' }, { status: 404 })
  }

  if (!config.is_enabled) {
    return NextResponse.json({ error: 'AI agent is disabled for this artist' }, { status: 403 })
  }

  // STEP 5: Rate limit → ai_daily_usage WHERE user_id + usage_date = todayRome. → 429
  const todayRome = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' })

  const { data: usageRow } = await supabase
    .from('ai_daily_usage')
    .select('message_count')
    .eq('user_id', authUser.id)
    .eq('usage_date', todayRome)
    .single()

  const currentCount = usageRow?.message_count ?? 0
  const dailyLimit = config.daily_message_limit ?? 50

  if (currentCount >= dailyLimit) {
    return NextResponse.json(
      { error: 'Daily message limit reached', remaining_messages: 0 },
      { status: 429 }
    )
  }

  // STEP 6: Fetch context (parallel):
  //   A) Last 5 posts from posts_with_details for this artist
  //   B) Next 5 upcoming (approved, scheduled_date >= now)
  //   Build AiContext. Fail gracefully.
  const now = new Date().toISOString()

  const [recentResult, upcomingResult] = await Promise.allSettled([
    supabase
      .from('posts_with_details')
      .select('*')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('posts_with_details')
      .select('*')
      .eq('artist_id', artist.id)
      .eq('status', 'approved')
      .gte('scheduled_date', now)
      .order('scheduled_date', { ascending: true })
      .limit(5),
  ])

  const context: AiContext = {}

  if (recentResult.status === 'fulfilled' && recentResult.value.data) {
    context.recentPosts = recentResult.value.data
  }

  if (upcomingResult.status === 'fulfilled' && upcomingResult.value.data) {
    context.upcomingPosts = upcomingResult.value.data
  }

  // STEP 7: buildSystemPrompt(config, context)
  const systemPrompt = buildSystemPrompt(config, context)

  // STEP 8: Load chat history → ai_chat_messages WHERE artist_id + session_date=todayRome, limit 50
  const { data: historyRows } = await supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('artist_id', artist.id)
    .eq('session_date', todayRome)
    .order('created_at', { ascending: true })
    .limit(50)

  const chatHistory = historyRows ?? []

  // STEP 9: buildMessages(systemPrompt, history, message, config.max_tokens)
  const messages = buildMessages(systemPrompt, chatHistory, message, config.max_tokens ?? 4000)

  // STEP 10: Provider → env key AI_${PROVIDER}_API_KEY → getProvider(config)
  const providerName = config.provider?.toUpperCase() ?? ''
  const apiKey = process.env[`AI_${providerName}_API_KEY`] ?? ''

  const provider = getProvider({
    provider: config.provider,
    apiKey,
    baseUrl: undefined,
  })

  // STEP 11: provider.complete({ model, messages, temperature, max_tokens }) → 502 on fail
  let completionResult
  try {
    completionResult = await provider.complete({
      model: config.model_name,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens ?? 4000,
    })
  } catch (err) {
    console.error('[ai-chat] provider.complete failed:', err)
    return NextResponse.json({ error: 'AI provider error' }, { status: 502 })
  }

  const reply = completionResult.content

  // STEP 12: Save user msg + assistant reply (2 inserts, non-fatal)
  const saveMessages = async () => {
    try {
      await supabase.from('ai_chat_messages').insert([
        {
          artist_id: artist.id,
          user_id: authUser.id,
          role: 'user',
          content: message,
          session_date: todayRome,
        },
        {
          artist_id: artist.id,
          user_id: authUser.id,
          role: 'assistant',
          content: reply,
          session_date: todayRome,
        },
      ])
    } catch (err) {
      console.error('[ai-chat] failed to save chat messages:', err)
    }
  }

  // STEP 13: Increment daily usage → RPC increment_daily_usage (non-fatal)
  const incrementUsage = async () => {
    try {
      await supabase.rpc('increment_daily_usage', {
        p_user_id: authUser.id,
        p_usage_date: todayRome,
      })
    } catch (err) {
      console.error('[ai-chat] failed to increment daily usage:', err)
    }
  }

  await Promise.allSettled([saveMessages(), incrementUsage()])

  // STEP 14: Return { reply, remaining_messages }
  const remaining_messages = Math.max(0, dailyLimit - (currentCount + 1))

  return NextResponse.json({ reply, remaining_messages })
}
