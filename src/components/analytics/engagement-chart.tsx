'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { InstagramInsight } from '@/types/models'

export function EngagementChart({ insights }: { insights: InstagramInsight[] }): JSX.Element {
  // Build chart data: one row per insight, showing the latest value
  const chartData = insights.map((insight) => {
    const latestValue =
      insight.values.length > 0 ? insight.values[insight.values.length - 1].value : 0
    return {
      name: insight.title ?? insight.name,
      valore: latestValue,
    }
  })

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: '#13131F', border: '1px solid #1E1E30' }}
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
        Panoramica Insights
      </h3>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1E1E30"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: 'oklch(0.55 0 0)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'oklch(0.55 0 0)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCompact(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#13131F',
              border: '1px solid #1E1E30',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
            }}
            formatter={(value: number) => [formatCompact(value), 'Valore']}
            cursor={{ fill: 'rgba(245, 197, 24, 0.06)' }}
          />
          <Bar
            dataKey="valore"
            fill="#F5C518"
            radius={[4, 4, 0, 0]}
            maxBarSize={64}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
