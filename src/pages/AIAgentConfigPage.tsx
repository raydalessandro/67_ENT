// ============================================================================
// AI Agent Config Page — Admin management for AI prompts
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner, ErrorState } from '@/components/ui/Primitives';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { AppError } from '@/lib/errors';
import type { AiAgentConfig } from '@/types/models';

export default function AIAgentConfigPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [config, setConfig] = useState<AiAgentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!artistId) return;
    const fetchConfig = async () => {
      setIsLoading(true);
      const result = await api.aiAgents.getByArtist(artistId);
      if (result.ok) {
        setConfig(result.data);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    };
    fetchConfig();
  }, [artistId]);

  const handleSave = async () => {
    if (!artistId || !user || !config) return;

    setIsSaving(true);
    const result = await api.aiAgents.update(artistId, {
      is_enabled: config.is_enabled,
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      daily_message_limit: config.daily_message_limit,
      prompt_identity: config.prompt_identity,
      prompt_activity: config.prompt_activity,
      prompt_ontology: config.prompt_ontology,
      prompt_marketing: config.prompt_marketing,
      prompt_boundaries: config.prompt_boundaries,
      prompt_extra: config.prompt_extra,
    }, user.id);

    if (result.ok) {
      toast.success('Configurazione salvata');
      navigate('/admin/ai-agents');
    } else {
      toast.error(result.error.message);
    }
    setIsSaving(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (!config) return null;

  return (
    <>
      <Header title="Configura Agente AI" showBack />

      <div className="p-4 pb-8 max-w-4xl mx-auto space-y-6">
        {/* Enable Toggle */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <h3 className="text-sm font-medium text-white">Agente Abilitato</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Permette all'artista di usare l'AI chat
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.is_enabled}
              onChange={(e) => setConfig({ ...config, is_enabled: e.target.checked })}
              className="w-5 h-5 rounded bg-gray-800 border-gray-700
                         checked:bg-indigo-600 checked:border-indigo-600
                         focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
            />
          </label>
        </div>

        {/* Model Parameters */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">Parametri Modello</h3>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modello
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="deepseek-chat">DeepSeek Chat (default)</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Temperature: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 = più preciso, 2 = più creativo
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              min="100"
              max="4096"
              step="128"
              value={config.max_tokens}
              onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Limite Messaggi Giornaliero
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={config.daily_message_limit}
              onChange={(e) => setConfig({ ...config, daily_message_limit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* System Prompts */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">System Prompt</h3>
          <p className="text-xs text-gray-500">
            Definisce chi è l'artista e come deve comportarsi l'AI
          </p>

          {/* Identity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Identità (Chi è l'artista)
            </label>
            <textarea
              value={config.prompt_identity ?? ''}
              onChange={(e) => setConfig({ ...config, prompt_identity: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 font-mono text-sm"
              placeholder="Es: Sei un rapper italiano emergente, cresciuto in periferia..."
            />
          </div>

          {/* Activity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attività (Progetti, cosa fa)
            </label>
            <textarea
              value={config.prompt_activity ?? ''}
              onChange={(e) => setConfig({ ...config, prompt_activity: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 font-mono text-sm"
              placeholder="Es: Sto lavorando al mio primo album, previsto per primavera 2025..."
            />
          </div>

          {/* Ontology */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ontologia (Valori, estetica, riferimenti)
            </label>
            <textarea
              value={config.prompt_ontology ?? ''}
              onChange={(e) => setConfig({ ...config, prompt_ontology: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 font-mono text-sm"
              placeholder="Es: Sono influenzato da artisti come Capo Plaza, Sfera Ebbasta..."
            />
          </div>

          {/* Marketing */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Marketing (Strategia, tone of voice)
            </label>
            <textarea
              value={config.prompt_marketing ?? ''}
              onChange={(e) => setConfig({ ...config, prompt_marketing: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 font-mono text-sm"
              placeholder="Es: Comunico in modo diretto, uso slang giovanile..."
            />
          </div>

          {/* Boundaries */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Boundaries (Cosa NON dire/fare)
            </label>
            <textarea
              value={config.prompt_boundaries ?? ''}
              onChange={(e) => setConfig({ ...config, prompt_boundaries: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 font-mono text-sm"
              placeholder="Es: Non parlare di politica, non dare opinioni su altri artisti..."
            />
          </div>

          {/* Extra */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Extra (Campo libero)
            </label>
            <textarea
              value={config.prompt_extra ?? ''}
              onChange={(e) => setConfig({ ...config, prompt_extra: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 font-mono text-sm"
              placeholder="Altre istruzioni..."
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                     bg-indigo-600 text-white hover:bg-indigo-500 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salva Configurazione
            </>
          )}
        </button>
      </div>
    </>
  );
}
