'use client'

interface BestDayCardProps {
  day: string
}

interface PeakHourCardProps {
  hour: number
}

const DAY_NAMES: Record<string, string> = {
  Monday: 'Lunedì',
  Tuesday: 'Martedì',
  Wednesday: 'Mercoledì',
  Thursday: 'Giovedì',
  Friday: 'Venerdì',
  Saturday: 'Sabato',
  Sunday: 'Domenica',
}

function formatHour(hour: number): string {
  const h = hour.toString().padStart(2, '0')
  return `${h}:00`
}

export function BestDayCard({ day }: BestDayCardProps) {
  const localizedDay = DAY_NAMES[day] ?? day

  return (
    <div className="rounded-xl bg-[#13131F] border border-[#1E1E30] p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Giorno Migliore
      </p>
      <p className="text-5xl font-black text-[#F5C518] leading-none">{localizedDay}</p>
      <p className="text-sm text-gray-400">per pubblicare i tuoi contenuti</p>
    </div>
  )
}

export function PeakHourCard({ hour }: PeakHourCardProps) {
  return (
    <div className="rounded-xl bg-[#13131F] border border-[#1E1E30] p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Orario di Picco
      </p>
      <p className="text-5xl font-black text-[#F5C518] leading-none">{formatHour(hour)}</p>
      <p className="text-sm text-gray-400">massimo engagement atteso</p>
    </div>
  )
}
