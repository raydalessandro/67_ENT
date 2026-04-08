export function KpiCard({
  label,
  value,
  icon,
  subtitle,
  trend,
}: {
  label: string
  value: string | number
  icon: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}): JSX.Element {
  return (
    <div
      className="group rounded-xl p-5 transition-all duration-200"
      style={{
        backgroundColor: '#13131F',
        border: '1px solid #1E1E30',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = '#F5C518'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 0 16px 2px rgba(245, 197, 24, 0.12)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = '#1E1E30'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Icon badge */}
      <div
        className="mb-3 inline-flex items-center justify-center rounded-lg text-xl"
        style={{
          width: 40,
          height: 40,
          backgroundColor: 'rgba(245, 197, 24, 0.10)',
        }}
      >
        {icon}
      </div>

      {/* Value + trend */}
      <div className="flex items-end gap-2">
        <span
          className="text-4xl font-black tabular-nums leading-none"
          style={{ color: '#F5C518' }}
        >
          {value}
        </span>
        {trend && trend !== 'neutral' && (
          <span
            className="mb-1 text-base font-bold"
            style={{ color: trend === 'up' ? '#22c55e' : '#ef4444' }}
          >
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>

      {/* Label */}
      <p
        className="mt-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'oklch(0.55 0 0)' }}
      >
        {label}
      </p>

      {/* Optional subtitle */}
      {subtitle && (
        <p className="mt-1 text-xs" style={{ color: 'oklch(0.45 0 0)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
