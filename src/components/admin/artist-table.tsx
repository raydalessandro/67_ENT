'use client'

import { useState } from 'react'
import { MoreVertical, Edit2, PowerOff, Power, Bot, KeyRound } from 'lucide-react'
import type { Artist } from '@/types/models'

interface ArtistTableProps {
  artists: Artist[]
  onEdit: (a: Artist) => void
  onDeactivate: (id: string) => void
  onToggleActive: (id: string, active: boolean) => void
  onConfigureAi: (id: string) => void
  onResetPassword: (userId: string) => void
}

interface DropdownMenuProps {
  artist: Artist
  onEdit: (a: Artist) => void
  onDeactivate: (id: string) => void
  onToggleActive: (id: string, active: boolean) => void
  onConfigureAi: (id: string) => void
  onResetPassword: (userId: string) => void
}

function DropdownMenu({
  artist,
  onEdit,
  onDeactivate,
  onToggleActive,
  onConfigureAi,
  onResetPassword,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
  }

  const menuItemClass =
    'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-300 hover:bg-[#1E1E30] hover:text-white transition-colors text-left'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md hover:bg-[#1E1E30] text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
        aria-label="Azioni"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={close}
            aria-hidden="true"
          />

          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-[#13131F] border border-[#1E1E30] shadow-xl overflow-hidden">
            <button
              className={menuItemClass}
              onClick={() => { onEdit(artist); close() }}
            >
              <Edit2 size={14} className="text-gray-400" />
              Modifica
            </button>

            <button
              className={menuItemClass}
              onClick={() => { onResetPassword(artist.user_id); close() }}
            >
              <KeyRound size={14} className="text-gray-400" />
              Reset Password
            </button>

            <button
              className={menuItemClass}
              onClick={() => { onConfigureAi(artist.id); close() }}
            >
              <Bot size={14} className="text-gray-400" />
              Configura AI
            </button>

            <div className="border-t border-[#1E1E30] my-1" />

            {artist.is_active ? (
              <>
                <button
                  className={`${menuItemClass} text-amber-400 hover:text-amber-300`}
                  onClick={() => { onToggleActive(artist.id, false); close() }}
                >
                  <PowerOff size={14} />
                  Disattiva
                </button>
                <button
                  className={`${menuItemClass} text-red-400 hover:text-red-300`}
                  onClick={() => { onDeactivate(artist.id); close() }}
                >
                  <PowerOff size={14} />
                  Disattiva definitivamente
                </button>
              </>
            ) : (
              <button
                className={`${menuItemClass} text-green-400 hover:text-green-300`}
                onClick={() => { onToggleActive(artist.id, true); close() }}
              >
                <Power size={14} />
                Riattiva
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function HandleCell({ handle }: { handle: string | null }) {
  if (!handle) return <span className="text-gray-600 text-xs">—</span>
  return <span className="text-gray-400 text-xs">{handle}</span>
}

export function ArtistTable({
  artists,
  onEdit,
  onDeactivate,
  onToggleActive,
  onConfigureAi,
  onResetPassword,
}: ArtistTableProps) {
  if (artists.length === 0) {
    return (
      <div className="rounded-xl bg-[#13131F] border border-[#1E1E30] px-6 py-12 text-center">
        <p className="text-gray-500 text-sm">Nessun artista trovato.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#13131F] border border-[#1E1E30] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-[#1E1E30]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Artista
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Instagram
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                TikTok
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                YouTube
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Stato
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E1E30]">
            {artists.map((artist) => (
              <tr
                key={artist.id}
                className="hover:bg-[#0F0F1A]/50 transition-colors"
              >
                {/* Name + color dot */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex-shrink-0 w-3 h-3 rounded-full"
                      style={{ backgroundColor: artist.color }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-white">{artist.name}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <HandleCell handle={artist.instagram_handle} />
                </td>

                <td className="px-4 py-3">
                  <HandleCell handle={artist.tiktok_handle} />
                </td>

                <td className="px-4 py-3">
                  <HandleCell handle={artist.youtube_handle} />
                </td>

                {/* Active badge */}
                <td className="px-4 py-3">
                  {artist.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-900/30 border border-green-700/30 text-green-400 text-[11px] font-semibold px-2.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Attivo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-800/40 border border-gray-700/30 text-gray-500 text-[11px] font-semibold px-2.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                      Inattivo
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <DropdownMenu
                    artist={artist}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                    onToggleActive={onToggleActive}
                    onConfigureAi={onConfigureAi}
                    onResetPassword={onResetPassword}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
