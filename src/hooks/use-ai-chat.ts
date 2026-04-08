'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { AiChatMessage } from '@/types/models'
import type { AiChatResponse } from '@/types/api'

export function useAiChat(artistId: string): {
  messages: AiChatMessage[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  remainingMessages: number
  sendMessage(content: string): Promise<void>
} {
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remainingMessages, setRemainingMessages] = useState(0)

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true)
      const supabase = createBrowserClient()
      const todayRome = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' })

      const [messagesResult, usageResult, configResult] = await Promise.allSettled([
        supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('artist_id', artistId)
          .eq('session_date', todayRome)
          .order('created_at', { ascending: true }),
        supabase
          .from('ai_daily_usage')
          .select('*')
          .eq('artist_id', artistId)
          .eq('usage_date', todayRome)
          .single(),
        supabase
          .from('ai_agent_configs')
          .select('daily_message_limit')
          .eq('artist_id', artistId)
          .single(),
      ])

      if (messagesResult.status === 'fulfilled' && messagesResult.value.data) {
        setMessages(messagesResult.value.data as AiChatMessage[])
      }

      const dailyLimit =
        configResult.status === 'fulfilled' && configResult.value.data
          ? (configResult.value.data as { daily_message_limit: number }).daily_message_limit
          : 20

      const usedCount =
        usageResult.status === 'fulfilled' && usageResult.value.data
          ? (usageResult.value.data as { message_count: number }).message_count
          : 0

      setRemainingMessages(Math.max(0, dailyLimit - usedCount))

      setIsLoading(false)
    }

    loadHistory()
  }, [artistId])

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      // Guard: skip if already sending
      if (isSending) return

      // Guard: skip if empty
      if (!content.trim()) return

      // Guard: no remaining messages
      if (remainingMessages <= 0) {
        setError('Hai raggiunto il limite giornaliero di messaggi.')
        return
      }

      // Optimistic: add user message immediately
      const optimisticUserMsg: AiChatMessage = {
        id: `optimistic-${Date.now()}`,
        artist_id: artistId,
        user_id: '',
        role: 'user',
        content,
        session_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }),
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, optimisticUserMsg])
      setIsSending(true)
      setError(null)

      try {
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content }),
        })

        if (!response.ok) {
          // Rollback optimistic message
          setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))

          if (response.status === 429) {
            setError('Hai raggiunto il limite giornaliero di messaggi.')
          } else if (response.status === 502) {
            setError('Servizio AI non disponibile. Riprova più tardi.')
          } else {
            setError('Si è verificato un errore. Riprova.')
          }
          return
        }

        const data = (await response.json()) as AiChatResponse

        const assistantMsg: AiChatMessage = {
          id: `assistant-${Date.now()}`,
          artist_id: artistId,
          user_id: '',
          role: 'assistant',
          content: data.reply,
          session_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }),
          created_at: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, assistantMsg])
        setRemainingMessages(data.remaining_messages)
      } catch {
        // Rollback optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
        setError('Errore di connessione. Riprova.')
      } finally {
        setIsSending(false)
      }
    },
    [artistId, isSending, remainingMessages]
  )

  return { messages, isLoading, isSending, error, remainingMessages, sendMessage }
}
