'use client'

interface RecommendationsProps {
  items: string[]
}

export function Recommendations({ items }: RecommendationsProps) {
  return (
    <div className="rounded-xl bg-[#13131F] border border-[#1E1E30] p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        Raccomandazioni
      </h3>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">Nessuna raccomandazione disponibile.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 rounded-lg bg-purple-950/30 border border-purple-800/20 px-4 py-3"
            >
              <span className="text-lg leading-snug select-none">💡</span>
              <span className="text-sm text-gray-200 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 rounded-lg bg-purple-900/20 border border-purple-700/30 px-4 py-3">
        <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">Pro Tip</p>
        <p className="text-sm text-purple-200/80">
          Applica queste raccomandazioni gradualmente e monitora l&apos;impatto sui tuoi KPI nelle settimane successive.
        </p>
      </div>
    </div>
  )
}
