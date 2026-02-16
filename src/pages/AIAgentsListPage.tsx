// ============================================================================
// AI Agents List Page — Admin list of all AI agent configs
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner, ErrorState, EmptyState, Badge } from '@/components/ui/Primitives';
import { api } from '@/lib/api';
import type { AppError } from '@/lib/errors';
import type { AiAgentConfigWithArtist } from '@/types/models';

export default function AIAgentsListPage() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<AiAgentConfigWithArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      setIsLoading(true);
      const result = await api.aiAgents.getAll();
      if (result.ok) {
        setConfigs(result.data);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    };
    fetchConfigs();
  }, []);

  return (
    <>
      <Header title="Agenti AI" showBack />

      <div className="p-4 space-y-3 pb-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState error={error} onRetry={() => window.location.reload()} />
        ) : configs.length === 0 ? (
          <EmptyState
            message="Nessun agente AI"
            description="Crea un artista per configurare il suo agente AI"
          />
        ) : (
          configs.map((config) => (
            <button
              key={config.id}
              onClick={() => navigate(`/admin/ai-agents/${config.artist_id}`)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-800
                         bg-gray-900 hover:bg-gray-800 transition-colors text-left"
            >
              {/* Artist Color */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: config.artist_color + '20' }}
              >
                <Settings
                  className="w-5 h-5"
                  style={{ color: config.artist_color }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">
                  {config.artist_name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {config.model} • {config.daily_message_limit} msg/giorno
                </p>
              </div>

              {/* Status Badge */}
              <Badge
                size="sm"
                color={config.is_enabled ? '#10b981' : '#6b7280'}
                bgColor={config.is_enabled ? '#10b98120' : '#6b728020'}
              >
                {config.is_enabled ? 'Attivo' : 'Disabilitato'}
              </Badge>

              <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </>
  );
}
