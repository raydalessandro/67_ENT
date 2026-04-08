'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import type { AiChatMessage } from '@/types/models'

interface ChatInterfaceProps {
  messages: AiChatMessage[]
  onSend: (content: string) => Promise<void>
  isSending: boolean
  remainingMessages: number
  isEnabled: boolean
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

export function ChatInterface({
  messages,
  onSend,
  isSending,
  remainingMessages,
  isEnabled,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  async function handleSend() {
    const text = input.trim()
    if (!text || isSending || !isEnabled || remainingMessages <= 0) return
    setInput('')
    await onSend(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = isEnabled && remainingMessages > 0 && !isSending

  return (
    <div className="flex flex-col h-full rounded-xl bg-[#13131F] border border-[#1E1E30] overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600 text-sm text-center">
              Inizia una conversazione con il tuo assistente AI.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#F5C518] text-black font-medium rounded-br-sm'
                  : 'bg-[#0F0F1A] border border-[#1E1E30] text-gray-200 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-[#0F0F1A] border border-[#1E1E30] rounded-2xl rounded-bl-sm px-3 py-2">
              <LoadingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="border-t border-[#1E1E30] px-4 py-3 flex flex-col gap-2">
        {!isEnabled && (
          <p className="text-xs text-red-400 text-center">
            La chat AI non è attiva per questo artista.
          </p>
        )}

        {isEnabled && remainingMessages <= 0 && (
          <p className="text-xs text-amber-400 text-center">
            Hai esaurito i messaggi giornalieri. Riprova domani.
          </p>
        )}

        {isEnabled && remainingMessages > 0 && (
          <p className="text-xs text-gray-600 text-right">
            {remainingMessages} messaggi rimanenti oggi
          </p>
        )}

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canSend}
            placeholder={
              !isEnabled
                ? 'Chat non disponibile'
                : remainingMessages <= 0
                ? 'Limite giornaliero raggiunto'
                : 'Scrivi un messaggio… (Invio per inviare)'
            }
            rows={1}
            className="flex-1 resize-none rounded-lg bg-[#0F0F1A] border border-[#1E1E30] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#F5C518]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend || !input.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#F5C518] text-black flex items-center justify-center hover:bg-[#e6b800] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Invia messaggio"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
