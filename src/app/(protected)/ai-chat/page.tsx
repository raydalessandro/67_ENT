'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useAiChat } from '@/hooks/use-ai-chat'
import { ChatInterface } from '@/components/ai/chat-interface'

export default function AiChatPage() {
  const { artist, isStaff, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { messages, isLoading, isSending, error, remainingMessages, sendMessage } = useAiChat(artist?.id ?? '')

  useEffect(() => {
    if (!authLoading && (isStaff || !artist)) router.replace('/')
  }, [authLoading, isStaff, artist, router])

  if (authLoading || isLoading) {
    return <div className="p-6 flex items-center justify-center h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-[#F5C518] border-t-transparent rounded-full" /></div>
  }

  if (!artist) return null

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-[#1E1E30]">
        <h1 className="text-xl font-black text-white">Assistente AI</h1>
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSend={sendMessage}
          isSending={isSending}
          remainingMessages={remainingMessages}
          isEnabled={true}
        />
      </div>
    </div>
  )
}
