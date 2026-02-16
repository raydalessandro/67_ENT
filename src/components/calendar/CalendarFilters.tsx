// ============================================================================
// Calendar Filters
// ============================================================================

import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { api } from '@/lib/api';
import { POST_PLATFORMS, POST_STATUSES, PLATFORM_CONFIG, STATUS_CONFIG } from '@/types/enums';
import { useAuthStore } from '@/stores/authStore';
import type { CalendarFilters as Filters } from '@/types/api';
import type { Artist } from '@/types/models';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function CalendarFilters({ filters, onChange }: Props) {
  const { isStaff } = useAuthStore();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const hasFilters = !!(filters.artist_id || filters.platform || filters.status);

  // Load artists list (staff only)
  useEffect(() => {
    if (!isStaff) return;
    api.artists.getAll().then((r) => {
      if (r.ok) setArtists(r.data);
    });
  }, [isStaff]);

  const clearFilters = () => {
    onChange({ month: filters.month, year: filters.year });
    setIsOpen(false);
  };

  return (
    <div className="px-4 py-2">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filtri
        {hasFilters && (
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
        )}
      </button>

      {/* Filter panel */}
      {isOpen && (
        <div className="mt-3 p-3 bg-gray-900 rounded-xl space-y-3">
          {/* Artist filter (staff only) */}
          {isStaff && artists.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Artista</label>
              <select
                value={filters.artist_id ?? ''}
                onChange={(e) => onChange({ ...filters, artist_id: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                           text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tutti</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Platform filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Piattaforma</label>
            <select
              value={filters.platform ?? ''}
              onChange={(e) => onChange({ ...filters, platform: (e.target.value || undefined) as Filters['platform'] })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tutte</option>
              {POST_PLATFORMS.map((p) => (
                <option key={p} value={p}>{PLATFORM_CONFIG[p].label}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Stato</label>
            <select
              value={filters.status ?? ''}
              onChange={(e) => onChange({ ...filters, status: (e.target.value || undefined) as Filters['status'] })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tutti</option>
              {POST_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
              Rimuovi filtri
            </button>
          )}
        </div>
      )}
    </div>
  );
}
