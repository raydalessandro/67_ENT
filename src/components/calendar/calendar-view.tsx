'use client'

import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { PostWithDetails, PostStatus } from '@/types/models'

// ── Types ──

export interface CalendarEvent {
  id: string
  title: string
  start: string
  backgroundColor: string
  borderColor: string
  extendedProps: {
    post: PostWithDetails
  }
}

// ── Pure function ──

const STATUS_OPACITY: Record<PostStatus, number> = {
  draft: 0.4,
  in_review: 0.7,
  approved: 1.0,
  published: 1.0,
  rejected: 0.3,
}

function hexToRgba(hex: string, opacity: number): string {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export function mapPostsToEvents(posts: PostWithDetails[]): CalendarEvent[] {
  return posts
    .filter((post) => post.scheduled_date !== null)
    .map((post) => {
      const opacity = STATUS_OPACITY[post.status] ?? 1.0
      const color = hexToRgba(post.artist_color, opacity)

      return {
        id: post.id,
        title: post.title,
        start: post.scheduled_date!,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          post,
        },
      }
    })
}

// ── Component ──

interface CalendarViewProps {
  posts: PostWithDetails[]
  onEventClick: (postId: string) => void
  onDateClick?: (date: string) => void
  isLoading?: boolean
}

export function CalendarView({
  posts,
  onEventClick,
  onDateClick,
  isLoading,
}: CalendarViewProps) {
  const events = useMemo(() => mapPostsToEvents(posts), [posts])

  function renderEventContent(arg: EventContentArg) {
    const post = arg.event.extendedProps.post as PostWithDetails
    const hasThumb = post.first_media_url && post.first_media_type === 'image'
    const hasVideo = post.first_media_url && post.first_media_type === 'video'

    return (
      <div className="fc-custom-event">
        {hasThumb && (
          <img
            src={post.first_media_url!}
            alt=""
            className="fc-event-thumb"
          />
        )}
        {hasVideo && !hasThumb && (
          <span className="fc-event-video-badge" title="Video">&#9654;</span>
        )}
        <span className="fc-event-title">{arg.event.title}</span>
      </div>
    )
  }

  function handleEventClick(info: EventClickArg) {
    onEventClick(info.event.id)
  }

  function handleDateClick(info: DateClickArg) {
    onDateClick?.(info.dateStr)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-[#13131F]" />
        ))}
      </div>
    )
  }

  return (
    <div className="fc-dark-theme">
      <style>{`
        .fc-dark-theme {
          --fc-border-color: #1E1E30;
          --fc-page-bg-color: #0F0F1A;
          --fc-neutral-bg-color: #13131F;
          --fc-list-event-hover-bg-color: #1a1a2e;
          --fc-today-bg-color: rgba(245, 197, 24, 0.06);
          --fc-event-text-color: #fff;
        }
        .fc-dark-theme .fc {
          color: #e5e7eb;
        }
        .fc-dark-theme .fc .fc-toolbar-title {
          color: #fff;
          font-size: 1.125rem;
          font-weight: 700;
          text-transform: capitalize;
        }
        .fc-dark-theme .fc .fc-button {
          background-color: #13131F;
          border-color: #1E1E30;
          color: #e5e7eb;
          font-size: 0.8125rem;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          text-transform: capitalize;
        }
        .fc-dark-theme .fc .fc-button:hover {
          background-color: #1a1a2e;
          border-color: rgba(245, 197, 24, 0.4);
          color: #fff;
        }
        .fc-dark-theme .fc .fc-button-active,
        .fc-dark-theme .fc .fc-button:active {
          background-color: #F5C518 !important;
          border-color: #F5C518 !important;
          color: #000 !important;
        }
        .fc-dark-theme .fc .fc-today-button {
          text-transform: capitalize;
        }
        .fc-dark-theme .fc .fc-today-button:disabled {
          opacity: 0.4;
        }
        .fc-dark-theme .fc .fc-col-header-cell {
          background-color: #13131F;
          border-color: #1E1E30;
          padding: 0.5rem 0;
        }
        .fc-dark-theme .fc .fc-col-header-cell-cushion {
          color: #9ca3af;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          text-decoration: none;
        }
        .fc-dark-theme .fc .fc-daygrid-day {
          border-color: #1E1E30;
        }
        .fc-dark-theme .fc .fc-daygrid-day-number {
          color: #9ca3af;
          font-size: 0.8125rem;
          padding: 0.375rem 0.5rem;
          text-decoration: none;
        }
        .fc-dark-theme .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: #F5C518;
          font-weight: 700;
        }
        .fc-dark-theme .fc .fc-daygrid-day-frame {
          min-height: 5rem;
        }
        .fc-dark-theme .fc .fc-event {
          border-radius: 0.25rem;
          padding: 0.125rem 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          border-width: 0;
          border-left-width: 3px;
        }
        .fc-dark-theme .fc .fc-event:hover {
          filter: brightness(1.2);
        }
        .fc-dark-theme .fc .fc-daygrid-more-link {
          color: #F5C518;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .fc-dark-theme .fc .fc-scrollgrid {
          border-color: #1E1E30;
        }
        .fc-dark-theme .fc .fc-day-other .fc-daygrid-day-number {
          color: #4b5563;
        }
        /* Custom event with thumbnail */
        .fc-custom-event {
          display: flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          width: 100%;
        }
        .fc-event-thumb {
          width: 20px;
          height: 20px;
          border-radius: 3px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .fc-event-video-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 3px;
          background: rgba(0, 0, 0, 0.4);
          font-size: 10px;
          flex-shrink: 0;
          color: #fff;
        }
        .fc-event-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="it"
        events={events}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dateClick={onDateClick ? handleDateClick : undefined}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        buttonText={{
          today: 'Oggi',
        }}
        height="auto"
        dayMaxEvents={4}
        fixedWeekCount={false}
        firstDay={1}
      />
    </div>
  )
}
