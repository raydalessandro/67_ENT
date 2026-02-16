// ============================================================================
// AI Chat Admin — List all artists with AI chat sessions
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/Primitives';
import { api } from '@/lib/api';
import type { AppError } from '@/lib/errors';
import type { Artist } from '@/types/models';

export default function AIChatAdminPage() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const result = await api.artists.getAll();
      if (result.ok) setArtists(result.data);
      else setError(result.error);
      setIsLoading(false);
    };
    fetch();
  }, []);

  return (
    <>
      <Header title="Chat AI — Artisti" showBack />
      <div className="p-4 space-y-3 pb-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState error={error} onRetry={() => window.location.reload()} />
        ) : artists.length === 0 ? (
          <EmptyState message="Nessun artista" description="Crea artisti dalla gestione artisti" />
        ) : (
          artists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => {
                console.log('[AIChatAdminPage] Navigating to artist:', artist.id, artist.name);
                navigate(`/ai-chat/admin/${artist.id}`);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-800 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: artist.color + '20' }}
              >
                <MessageSquare className="w-5 h-5" style={{ color: artist.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{artist.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Vedi conversazioni AI</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </>
  );
}
