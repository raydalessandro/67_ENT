// ============================================================================
// Admin — Manage Artists
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Users, KeyRound, Trash2, Copy, Check,
  Loader2, ChevronDown, ChevronUp, Power, Bot, Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner, ErrorState, EmptyState, Badge } from '@/components/ui/Primitives';
import { adminApi, type ArtistListItem, type CreateArtistInput } from '@/lib/adminApi';
import { cn } from '@/lib/utils';
import type { AppError } from '@/lib/errors';

// ── Color presets ──
const COLOR_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#ef4444',
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<ArtistListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadArtists = useCallback(async () => {
    setIsLoading(true);
    const result = await adminApi.listArtists();
    if (result.ok) {
      setArtists(result.data.artists);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadArtists();
  }, [loadArtists]);

  return (
    <>
      <Header title="Gestione Artisti" />

      <div className="p-4 space-y-4 pb-8">
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm
                       active:scale-[0.98] transition-all"
            data-testid="create-artist-btn"
          >
            <UserPlus className="w-5 h-5" />
            Nuovo Artista
          </button>
          <button
            onClick={() => navigate('/admin/ai-agents')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm
                       active:scale-[0.98] transition-all"
          >
            <Settings className="w-5 h-5" />
            Configura AI
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <CreateArtistForm
            onCreated={() => {
              loadArtists();
              setShowCreateForm(false);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Artists list */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState error={error} onRetry={loadArtists} />
        ) : artists.length === 0 ? (
          <EmptyState
            icon={Users}
            message="Nessun artista"
            description="Crea il primo artista per iniziare"
          />
        ) : (
          <div className="space-y-3">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                isExpanded={expandedId === artist.id}
                onToggle={() => setExpandedId(expandedId === artist.id ? null : artist.id)}
                onUpdate={loadArtists}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Create Artist Form ──

function CreateArtistForm({
  onCreated,
  onCancel,
}: {
  onCreated: (data: any) => void;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [form, setForm] = useState<CreateArtistInput>({
    email: '',
    password: '',
    display_name: '',
    artist_name: '',
    color: COLOR_PRESETS[0],
    instagram_handle: '',
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, password: pwd });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.display_name || !form.artist_name) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    setIsSubmitting(true);
    const result = await adminApi.createArtist(form);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(result.data.message);
      setCreatedCredentials(result.data.credentials);
    } else {
      toast.error(result.error.userMessage);
    }
  };

  // After creation: show credentials to copy
  if (createdCredentials) {
    return (
      <CredentialsCard
        email={createdCredentials.email}
        password={createdCredentials.password}
        artistName={form.artist_name}
        onDone={() => {
          setCreatedCredentials(null);
          onCreated(null);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-900 rounded-xl space-y-4">
      <h3 className="text-sm font-semibold text-white">Nuovo Artista</h3>

      <div className="grid grid-cols-2 gap-3">
        <FormInput
          label="Nome artista *"
          value={form.artist_name}
          onChange={(v) => setForm({ ...form, artist_name: v, display_name: v })}
          placeholder="Nome d'arte"
        />
        <FormInput
          label="Email *"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="artista@email.com"
        />
      </div>

      {/* Password con genera */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Password *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="flex-1 input-field text-sm"
            placeholder="Min. 6 caratteri"
          />
          <button
            type="button"
            onClick={generatePassword}
            className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs
                       hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            Genera
          </button>
        </div>
      </div>

      {/* Colore */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Colore *</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all',
                form.color === c ? 'border-white scale-110' : 'border-transparent',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Social handles */}
      <FormInput
        label="Instagram handle"
        value={form.instagram_handle ?? ''}
        onChange={(v) => setForm({ ...form, instagram_handle: v })}
        placeholder="@nomeutente"
      />

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm
                     hover:bg-gray-700 transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                     bg-indigo-600 text-white rounded-xl text-sm font-medium
                     hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Creazione...' : 'Crea Artista'}
        </button>
      </div>
    </form>
  );
}

// ── Credentials Card (post-creation, copyable) ──

function CredentialsCard({
  email,
  password,
  artistName,
  onDone,
}: {
  email: string;
  password: string;
  artistName: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const whatsappText = `Ciao! Ecco le tue credenziali per 67 Hub:\n\n📧 Email: ${email}\n🔑 Password: ${password}\n\n🔗 Accedi qui: ${window.location.origin}\n\nSe hai problemi contattaci!`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    toast.success('Copiato! Incolla su WhatsApp');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl space-y-4">
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-semibold text-emerald-300">
          {artistName} creato!
        </h3>
      </div>

      <div className="bg-gray-900 rounded-lg p-3 space-y-2 font-mono text-sm">
        <p className="text-gray-400">
          📧 <span className="text-white">{email}</span>
        </p>
        <p className="text-gray-400">
          🔑 <span className="text-white">{password}</span>
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                     bg-gray-800 text-white rounded-xl text-sm
                     hover:bg-gray-700 active:scale-95 transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiato!' : 'Copia'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                     bg-green-600 text-white rounded-xl text-sm
                     hover:bg-green-700 active:scale-95 transition-all"
        >
          📱 WhatsApp
        </button>
      </div>

      <button
        onClick={onDone}
        className="w-full text-center text-xs text-gray-500 hover:text-gray-300 py-1"
      >
        Chiudi
      </button>
    </div>
  );
}

// ── Artist Card ──

function ArtistCard({
  artist,
  isExpanded,
  onToggle,
  onUpdate,
}: {
  artist: ArtistListItem;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
}) {
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(artist.ai_enabled ?? true);
  const [isTogglingAi, setIsTogglingAi] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password minimo 6 caratteri');
      return;
    }
    setIsResetting(true);
    const result = await adminApi.resetPassword(artist.user_id, newPassword);
    setIsResetting(false);

    if (result.ok) {
      toast.success('Password aggiornata');
      setShowResetPwd(false);
      setNewPassword('');
    } else {
      toast.error(result.error.userMessage);
    }
  };

  const handleToggleActive = async () => {
    setIsToggling(true);
    const result = await adminApi.updateArtist(artist.id, { is_active: !artist.is_active });
    setIsToggling(false);

    if (result.ok) {
      toast.success(artist.is_active ? 'Artista disattivato' : 'Artista riattivato');
      onUpdate();
    } else {
      toast.error(result.error.userMessage);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Eliminare ${artist.name}? Questa azione è irreversibile.`)) return;
    setIsDeleting(true);
    const result = await adminApi.deleteArtist(artist.id, artist.user_id);
    setIsDeleting(false);

    if (result.ok) {
      toast.success('Artista eliminato');
      onUpdate();
    } else {
      toast.error(result.error.userMessage);
    }
  };

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-colors',
      artist.is_active ? 'border-gray-800' : 'border-gray-800 opacity-50',
    )}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full p-4 text-left hover:bg-gray-900 transition-colors"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: artist.color }}
        >
          {artist.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{artist.name}</p>
          <p className="text-xs text-gray-500 truncate">{artist.users?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {!artist.is_active && (
            <Badge size="sm" color="#ef4444" bgColor="#ef444420">Inattivo</Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-800 space-y-3 pt-3">
          {/* Info */}
          <div className="text-xs text-gray-500 space-y-1">
            {artist.instagram_handle && <p>IG: {artist.instagram_handle}</p>}
            {artist.bio && <p>{artist.bio}</p>}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {/* AI toggle */}
            <button
              onClick={async () => {
                setIsTogglingAi(true);
                const result = await adminApi.toggleAI(artist.id, !aiEnabled);
                setIsTogglingAi(false);
                if (result.ok) {
                  setAiEnabled(!aiEnabled);
                  toast.success(aiEnabled ? 'AI disattivata' : 'AI attivata');
                } else {
                  toast.error(result.error.userMessage);
                }
              }}
              disabled={isTogglingAi}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors disabled:opacity-50',
                aiEnabled
                  ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30'
                  : 'bg-gray-800 text-gray-500 hover:bg-gray-700',
              )}
            >
              <Bot className="w-3.5 h-3.5" />
              {isTogglingAi ? '...' : aiEnabled ? 'AI attiva' : 'AI spenta'}
            </button>

            {/* Reset password */}
            <button
              onClick={() => setShowResetPwd(!showResetPwd)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-300
                         rounded-lg text-xs hover:bg-gray-700 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Reset Password
            </button>

            {/* Toggle active */}
            <button
              onClick={handleToggleActive}
              disabled={isToggling}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-300
                         rounded-lg text-xs hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <Power className="w-3.5 h-3.5" />
              {isToggling ? '...' : artist.is_active ? 'Disattiva' : 'Riattiva'}
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-900/30 text-red-400
                         rounded-lg text-xs hover:bg-red-900/50 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? '...' : 'Elimina'}
            </button>
          </div>

          {/* Reset password form */}
          {showResetPwd && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nuova password (min 6)"
                className="flex-1 input-field text-sm"
              />
              <button
                onClick={handleResetPassword}
                disabled={isResetting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs
                           hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isResetting ? '...' : 'Salva'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reusable form input ──

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field text-sm"
      />
    </div>
  );
}
