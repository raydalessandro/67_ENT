import type { InstagramAccount } from '@/types/models'
import Image from 'next/image'

export function AccountOverview({ account }: { account: InstagramAccount }): React.ReactElement {
  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: '#13131F', border: '1px solid #1E1E30' }}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* Profile picture with gold border ring */}
        <div
          className="shrink-0 rounded-full p-[3px]"
          style={{ background: '#F5C518' }}
        >
          {account.profile_picture_url ? (
            <Image
              src={account.profile_picture_url}
              alt={account.username}
              width={80}
              height={80}
              className="rounded-full object-cover"
              style={{ width: 80, height: 80 }}
              unoptimized
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-full text-2xl font-bold"
              style={{
                width: 80,
                height: 80,
                backgroundColor: '#1E1E30',
                color: '#F5C518',
              }}
            >
              {account.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 text-center sm:text-left">
          {account.name && (
            <p className="text-lg font-semibold text-white">{account.name}</p>
          )}
          <p className="text-sm font-medium" style={{ color: '#F5C518' }}>
            @{account.username}
          </p>
          {account.biography && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'oklch(0.65 0 0)' }}>
              {account.biography}
            </p>
          )}
          {account.website && (
            <a
              href={account.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs underline"
              style={{ color: '#F5C518' }}
            >
              {account.website}
            </a>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div
        className="mt-6 grid grid-cols-3 gap-4 rounded-lg p-4"
        style={{ backgroundColor: '#0F0F1A', border: '1px solid #1E1E30' }}
      >
        <StatCell label="Follower" value={account.followers_count} />
        <StatCell label="Seguiti" value={account.follows_count} />
        <StatCell label="Post" value={account.media_count} />
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-2xl font-black tabular-nums"
        style={{ color: '#F5C518' }}
      >
        {formatCompact(value)}
      </span>
      <span
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: 'oklch(0.55 0 0)' }}
      >
        {label}
      </span>
    </div>
  )
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
