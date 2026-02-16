// ============================================================================
// Toolkit Page — Guideline Sections
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/Primitives';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { routes } from '@/config/routes';
import type { AppError } from '@/lib/errors';
import type { GuidelineSection } from '@/types/models';

// Lucide icon map for dynamic icons
import * as Icons from 'lucide-react';

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const iconMap: Record<string, React.ElementType> = {
    'book-open': Icons.BookOpen,
    'image': Icons.Image,
    'hash': Icons.Hash,
    'calendar': Icons.Calendar,
    'music': Icons.Music,
    'video': Icons.Video,
    'mic': Icons.Mic,
    'pen-tool': Icons.PenTool,
    'palette': Icons.Palette,
    'layout': Icons.LayoutDashboard,
    'star': Icons.Star,
    'zap': Icons.Zap,
    'target': Icons.Target,
    'users': Icons.Users,
    'megaphone': Icons.Megaphone,
    'file-text': Icons.FileText,
  };

  const Icon = iconMap[name] ?? Icons.FileText;
  return <Icon className={className} />;
}

export default function ToolkitPage() {
  const navigate = useNavigate();
  const { isStaff } = useAuthStore();
  const [sections, setSections] = useState<GuidelineSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const result = await api.guidelines.getSections();
    if (result.ok) {
      setSections(result.data);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <>
      <Header title="Consigli & Materiali" />

      <div className="p-4 space-y-3">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState error={error} onRetry={fetch} />
        ) : sections.length === 0 ? (
          <EmptyState
            message="Nessuna sezione"
            description={isStaff ? 'Crea la prima sezione di linee guida' : 'Nessun materiale disponibile al momento'}
            icon={BookOpen}
          />
        ) : (
          sections.map((section) => (
            <button
              key={section.id}
              onClick={() => navigate(routes.toolkitSection(section.slug))}
              className="flex items-center gap-4 w-full p-4 rounded-xl
                         bg-gray-900 border border-gray-800
                         hover:bg-gray-800 active:scale-[0.98] transition-all text-left"
              data-testid={`section-${section.slug}`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-600/15 flex items-center justify-center">
                <DynamicIcon name={section.icon} className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white">{section.title}</p>
                {section.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{section.description}</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </>
  );
}
