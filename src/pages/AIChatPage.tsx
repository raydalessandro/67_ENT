// ============================================================================
// AI Chat Page — Daily context window, rate limiting
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, Loader2, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatTime, cn } from '@/lib/utils';
import { AI_MAX_MESSAGE_LENGTH } from '@/config/constants';
import type { AIChatMessage, AIUsageInfo } from '@/types/models';

export default function AIChatPage() {
  const { artist } = useAuthStore();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [usage, setUsage] = useState<AIUsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [agentDisabled, setAgentDisabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load today's messages + usage
  const loadData = useCallback(async () => {
    if (!artist) return;

    setIsLoading(true);

    const [messagesResult, usageResult] = await Promise.all([
      api.ai.getTodayMessages(artist.id),
      api.ai.getRemainingMessages(),
    ]);

    if (messagesResult.ok) setMessages(messagesResult.data);

    if (usageResult.ok) {
      setUsage(usageResult.data);
      if (!usageResult.data.is_enabled) setAgentDisabled(true);
    } else if (usageResult.error.code === 'AI_AGENT_DISABLED') {
      setAgentDisabled(true);
    }

    setIsLoading(false);
  }, [artist]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInput('');

    // Optimistic: show user message immediately
    const tempUserMsg: AIChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: '',
      role: 'user',
      content: text,
      tokens_used: null,
      model_used: null,
      response_time_ms: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    console.log('[AIChatPage] Sending message:', text);
    const result = await api.ai.sendMessage({ message: text });
    console.log('[AIChatPage] Send result:', result);

    if (result.ok) {
      console.log('[AIChatPage] Message sent successfully, session_id:', result.data.session_id);
      // Add assistant response
      const assistantMsg: AIChatMessage = {
        id: `resp-${Date.now()}`,
        session_id: result.data.session_id,
        role: 'assistant',
        content: result.data.message,
        tokens_used: null,
        model_used: null,
        response_time_ms: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setUsage({
        daily_limit: result.data.usage.daily_limit,
        used_today: result.data.usage.used_today,
        remaining: result.data.usage.remaining,
        is_enabled: true,
      });
    } else {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setInput(text); // restore input
      toast.error(result.error.userMessage);
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const remaining = usage?.remaining ?? 0;
  const limit = usage?.daily_limit ?? 20;
  const used = usage?.used_today ?? 0;

  if (agentDisabled) {
    return (
      <>
        <Header title="Assistente AI" />
        <EmptyState
          icon={Bot}
          message="Assistente non ancora attivo"
          description="L'etichetta non ha ancora configurato il tuo assistente AI"
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Header title="Assistente AI" />

      {/* Usage indicator */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>Oggi</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={cn(
            'font-medium',
            remaining <= 3 ? 'text-red-400' : remaining <= 10 ? 'text-yellow-400' : 'text-gray-400'
          )}>
            {used}/{limit}
          </span>
          <span className="text-gray-600">messaggi</span>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-container p-4 space-y-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400 text-sm mb-1">Il tuo assistente è pronto</p>
            <p className="text-gray-600 text-xs">Chiedimi qualsiasi cosa su contenuti, strategia o social media</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      {remaining > 0 ? (
        <div
          className="border-t border-gray-800 bg-gray-950 p-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio..."
              rows={1}
              maxLength={AI_MAX_MESSAGE_LENGTH}
              className="flex-1 resize-none rounded-xl bg-gray-800 text-white
                         px-4 py-3 max-h-32 overflow-y-auto
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         placeholder-gray-500"
              style={{ minHeight: '44px', fontSize: '16px' }}
              data-testid="ai-chat-input"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="flex-shrink-0 w-11 h-11 rounded-full bg-indigo-600
                         flex items-center justify-center
                         disabled:opacity-50 active:scale-95 transition-all"
              data-testid="ai-chat-send"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          {input.length > AI_MAX_MESSAGE_LENGTH * 0.8 && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              {input.length}/{AI_MAX_MESSAGE_LENGTH}
            </p>
          )}
        </div>
      ) : (
        <div
          className="border-t border-gray-800 bg-gray-950 p-4 text-center"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Hai esaurito i messaggi di oggi. Si resettano a mezzanotte.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chat Bubble ──

function ChatBubble({ message }: { message: AIChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser ? 'bg-gray-700' : 'bg-indigo-600/20',
      )}>
        {isUser ? (
          <span className="text-xs font-bold text-white">Tu</span>
        ) : (
          <Bot className="w-4 h-4 text-indigo-400" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[85%] rounded-2xl px-4 py-3',
        isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-gray-800 text-gray-200 rounded-tl-sm',
      )}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        <p className={cn(
          'text-[10px] mt-1',
          isUser ? 'text-indigo-200' : 'text-gray-500',
        )}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
