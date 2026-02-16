// ============================================================================
// useCalendarEvents hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AppError } from '@/lib/errors';
import type { CalendarEvent } from '@/types/models';
import type { CalendarFilters } from '@/types/api';

export function useCalendarEvents(filters: CalendarFilters) {
  const [data, setData] = useState<CalendarEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await api.calendar.getEvents(filters);

    if (result.ok) {
      setData(result.data);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  }, [filters.month, filters.year, filters.artist_id, filters.platform, filters.status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
