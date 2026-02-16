// ============================================================================
// Create Section Modal — Form to create guideline sections
// ============================================================================

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const ICON_OPTIONS = [
  { value: 'book-open', label: '📖 Generale' },
  { value: 'image', label: '🖼️ Visual' },
  { value: 'hash', label: '#️⃣ Hashtag' },
  { value: 'calendar', label: '📅 Calendario' },
  { value: 'music', label: '🎵 Musica' },
  { value: 'video', label: '🎬 Video' },
  { value: 'mic', label: '🎤 Audio' },
  { value: 'pen-tool', label: '✍️ Scrittura' },
  { value: 'palette', label: '🎨 Design' },
  { value: 'layout', label: '📐 Layout' },
  { value: 'star', label: '⭐ Speciale' },
  { value: 'zap', label: '⚡ Urgente' },
  { value: 'target', label: '🎯 Obiettivi' },
  { value: 'users', label: '👥 Community' },
  { value: 'megaphone', label: '📢 Marketing' },
  { value: 'file-text', label: '📄 Documenti' },
];

export function CreateSectionModal({ onClose, onSuccess }: Props) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    icon: 'book-open',
    sort_order: 0,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim()) {
      toast.error('Inserisci un titolo');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Inserisci uno slug');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('guideline_sections').insert({
      title: formData.title,
      slug: formData.slug,
      description: formData.description || null,
      icon: formData.icon,
      sort_order: formData.sort_order,
      created_by: user.id,
    });

    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success('Sezione creata');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Nuova Sezione</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Titolo *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500"
              placeholder="Es: Instagram Feed"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slug * (generato automaticamente)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 font-mono text-sm"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: /toolkit/{formData.slug || 'slug'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrizione (opzionale)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 text-sm"
              placeholder="Breve descrizione della sezione"
              disabled={isSubmitting}
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Icona
            </label>
            <select
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              {ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ordinamento
            </label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Numero basso = appare prima
            </p>
          </div>
        </form>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-300
                       hover:bg-gray-800 transition-colors"
            disabled={isSubmitting}
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white
                       hover:bg-indigo-500 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creazione...' : 'Crea Sezione'}
          </button>
        </div>
      </div>
    </div>
  );
}
