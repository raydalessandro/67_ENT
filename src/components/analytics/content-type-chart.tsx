'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DerivedMetrics } from '@/types/models'

interface ContentTypeChartProps {
  performance: DerivedMetrics['contentTypePerformance']
}

const LABEL_MAP: Record<string, string> = {
  IMAGE: 'Immagini',
  VIDEO: 'Video',
  CAROUSEL_ALBUM: 'Caroselli',
}

export function ContentTypeChart({ performance }: ContentTypeChartProps) {
  const data = (Object.keys(performance) as Array<keyof typeof performance>).map((key) => ({
    name: LABEL_MAP[key] ?? key,
    engagement: Number(performance[key].avgEngagement.toFixed(2)),
    count: performance[key].count,
  }))

  return (
    <div className="rounded-xl bg-[#13131F] border border-[#1E1E30] p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
        Performance per Tipo di Contenuto
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E30" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9CA3AF', fontSize: 13 }}
            axisLine={{ stroke: '#1E1E30' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#13131F',
              border: '1px solid #1E1E30',
              borderRadius: 8,
              color: '#F5C518',
            }}
            labelStyle={{ color: '#E5E7EB' }}
            formatter={(value) => [`${value ?? 0}`, 'Eng. medio']}
          />
          <Bar dataKey="engagement" fill="#F5C518" radius={[4, 4, 0, 0]} maxBarSize={64} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
