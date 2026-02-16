// ============================================================================
// Calendar Page
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/Primitives';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { useAuthStore } from '@/stores/authStore';
import { STATUS_CONFIG } from '@/types/enums';
import { routes, ROUTES } from '@/config/routes';
import type { CalendarFilters as Filters } from '@/types/api';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { isStaff } = useAuthStore();
  const now = new Date();

  const [filters, setFilters] = useState<Filters>({
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  const { data: events, isLoading, error, refetch } = useCalendarEvents(filters);

  const calendarEvents = useMemo(() => {
    if (!events) return [];
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.scheduled_at,
      backgroundColor: e.artist_color + '33',
      borderColor: e.artist_color,
      textColor: '#fff',
      extendedProps: {
        status: e.status,
        platform: e.platform,
        artist_name: e.artist_name,
        artist_color: e.artist_color,
      },
    }));
  }, [events]);

  const handleEventClick = useCallback(
    (info: { event: { id: string } }) => {
      navigate(routes.postDetail(info.event.id));
    },
    [navigate],
  );

  const handleDatesSet = useCallback(
    (info: { start: Date }) => {
      const centerDate = new Date(info.start);
      centerDate.setDate(centerDate.getDate() + 15);
      setFilters((f) => ({
        ...f,
        month: centerDate.getMonth(),
        year: centerDate.getFullYear(),
      }));
    },
    [],
  );

  return (
    <>
      <Header title="Calendario" />

      {/* Filters */}
      <CalendarFilters filters={filters} onChange={setFilters} />

      {/* Calendar */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !events?.length ? (
          <EmptyState
            message="Nessun post programmato"
            description="Non ci sono post per questo mese"
          />
        ) : (
          <div className="calendar-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="it"
              firstDay={1}
              height="auto"
              events={calendarEvents}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              headerToolbar={{
                left: 'prev',
                center: 'title',
                right: 'next',
              }}
              eventContent={(info) => (
                <div className="px-1 py-0.5 text-xs truncate cursor-pointer">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                    style={{
                      backgroundColor:
                        STATUS_CONFIG[info.event.extendedProps.status as keyof typeof STATUS_CONFIG]
                          ?.color ?? '#6B7280',
                    }}
                  />
                  {info.event.title}
                </div>
              )}
              dayMaxEvents={3}
              moreLinkText={(n) => `+${n}`}
            />
          </div>
        )}

        {/* FAB: New Post (staff only) */}
        {isStaff && (
          <button
            onClick={() => navigate(ROUTES.POST_NEW)}
            className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-indigo-600 
                       flex items-center justify-center shadow-lg shadow-indigo-600/30
                       hover:bg-indigo-700 active:scale-90 transition-all z-30"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
            data-testid="new-post-fab"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </>
  );
}
