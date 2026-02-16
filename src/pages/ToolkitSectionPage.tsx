// ============================================================================
// Toolkit Section Page — Items list with read tracking
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, ChevronDown, ChevronUp, Star, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner, ErrorState, EmptyState, Badge } from '@/components/ui/Primitives';
import { CreateGuidelineModal } from '@/components/guidelines/CreateGuidelineModal';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { PRIORITY_CONFIG } from '@/types/enums';
import { formatDate, cn } from '@/lib/utils';
import type { AppError } from '@/lib/errors';
import type { GuidelineItemFull } from '@/types/models';

export default function ToolkitSectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isStaff } = useAuthStore();
  const [items, setItems] = useState<GuidelineItemFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    // For now we load all items and filter by section slug client-side
    // A proper implementation would use the section ID
    const result = await api.guidelines.getItems();
    if (result.ok) {
      setItems(result.data.filter((item) => item.section_slug === slug));
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleExpand = async (item: GuidelineItemFull) => {
    const isExpanding = expandedId !== item.id;
    setExpandedId(isExpanding ? item.id : null);

    // Mark as read when artist expands
    if (isExpanding && !item.is_read && !isStaff) {
      const result = await api.guidelines.markRead(item.id);
      if (result.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_read: true } : i)),
        );
      }
    }
  };

  const sectionTitle = items[0]?.section_title ?? slug ?? 'Sezione';
  const sectionId = items[0]?.section_id;

  return (
    <>
      <Header title={sectionTitle} showBack />

      <div className="p-4 space-y-3 pb-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState error={error} onRetry={fetch} />
        ) : items.length === 0 ? (
          <EmptyState
            message="Nessun contenuto"
            description="Questa sezione è vuota"
          />
        ) : (
          items.map((item) => {
            const isExpanded = expandedId === item.id;
            const priority = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG[0];
            const isCampaign = item.item_type === 'campaign';
            const isExpired = item.valid_until && new Date(item.valid_until) < new Date();

            if (isExpired && !isStaff) return null; // hide expired for artists

            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-xl border overflow-hidden transition-colors',
                  isExpired ? 'border-gray-800 opacity-60' : 'border-gray-800',
                  !item.is_read && !isStaff && 'border-l-2 border-l-indigo-500',
                )}
              >
                {/* Header — always visible */}
                <button
                  onClick={() => handleExpand(item)}
                  className="flex items-center gap-3 w-full p-4 text-left
                             hover:bg-gray-900 transition-colors"
                  data-testid={`item-${item.id}`}
                >
                  {/* Priority dot */}
                  {item.priority > 0 && (
                    <Star
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: priority.color }}
                      fill={item.priority === 2 ? priority.color : 'none'}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {item.title}
                      </span>
                      {!item.is_read && !isStaff && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                    </div>
                    {isCampaign && item.valid_until && (
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        Fino al {formatDate(item.valid_until, { year: undefined })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCampaign && (
                      <Badge size="sm" color="#f59e0b" bgColor="#f59e0b20">
                        Campaign
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* Content — expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-800">
                    <div className="prose prose-invert prose-sm max-w-none mt-3 text-gray-300">
                      <ReactMarkdown>{item.content}</ReactMarkdown>
                    </div>

                    {/* Attachment */}
                    {item.attachment_url && (
                      <a
                        href={item.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        📎 {item.attachment_name ?? 'Allegato'}
                      </a>
                    )}

                    {/* Meta (staff only) */}
                    {isStaff && (
                      <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 space-y-1">
                        <p>Creato da {item.created_by_name} il {formatDate(item.created_at)}</p>
                        <p>Tipo: {item.item_type} | Priorità: {priority.label}</p>
                        {item.target_all ? <p>Target: Tutti gli artisti</p> : <p>Target: Artisti selezionati</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FAB — Staff only */}
      {isStaff && sectionId && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500
                     rounded-full shadow-lg flex items-center justify-center
                     transition-colors z-40"
          aria-label="Aggiungi materiale"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Create Modal */}
      {showCreateModal && sectionId && (
        <CreateGuidelineModal
          sectionId={sectionId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetch();
            setShowCreateModal(false);
          }}
        />
      )}
    </>
  );
}
