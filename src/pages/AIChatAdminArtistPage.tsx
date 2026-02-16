// ============================================================================
// AI Chat Admin Artist — View AI chat sessions and messages for specific artist
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/Primitives';
import { api } from '@/lib/api';
import type { AppError } from '@/lib/errors';
import type { AIChatSessionAdmin, AIChatMessage } from '@/types/models';

export default function AIChatAdminArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const [sessions, setSessions] = useState<AIChatSessionAdmin[]>([]);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!artistId) return;
    const fetch = async () => {
      setIsLoading(true);
      const result = await api.ai.getArtistSessions(artistId);
      if (result.ok) {
        setSessions(result.data);
        if (result.data.length > 0) {
          setSelectedSession(result.data[0].id);
        }
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    };
    fetch();
  }, [artistId]);

  useEffect(() => {
    if (!selectedSession) return;
    const fetch = async () => {
      const result = await api.ai.getSessionMessages(selectedSession);
      if (result.ok) setMessages(result.data);
    };
    fetch();
  }, [selectedSession]);

  const artistName = sessions[0]?.artist_name ?? 'Artista';

  return (
    <>
      <Header title={`Chat AI — ${artistName}`} showBack />
      <div className="p-4 pb-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState error={error} onRetry={() => window.location.reload()} />
        ) : sessions.length === 0 ? (
          <EmptyState message="Nessuna chat" description="L'artista non ha ancora usato l'AI" />
        ) : (
          <>
            {/* Session selector */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedSession === s.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {new Date(s.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                  <span className="ml-1 opacity-60">({s.message_count})</span>
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-sm ${
                    m.role === 'user'
                      ? 'bg-indigo-600/20 text-indigo-100 ml-8'
                      : 'bg-gray-800 text-gray-200 mr-8'
                  }`}
                >
                  <p className="text-[10px] font-medium mb-1 opacity-50">
                    {m.role === 'user' ? '👤 Artista' : '🤖 AI'}
                    {' · '}
                    {new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
