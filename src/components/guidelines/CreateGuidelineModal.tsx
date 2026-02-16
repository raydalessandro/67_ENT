// ============================================================================
// Create Guideline Modal — Form to create/edit guideline items
// ============================================================================

import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { CreateGuidelineItemInput } from '@/types/api';
import type { GuidelineItemType, GuidelinePriority } from '@/types/enums';

interface Props {
  sectionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGuidelineModal({ sectionId, onClose, onSuccess }: Props) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateGuidelineItemInput>({
    section_id: sectionId,
    title: '',
    content: '',
    item_type: 'permanent',
    priority: 0,
    target_all: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.title.trim()) {
      toast.error('Inserisci un titolo');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Inserisci il contenuto');
      return;
    }

    setIsSubmitting(true);
    const result = await api.guidelines.createItem(formData, user.id);

    if (result.ok) {
      toast.success('Materiale creato');
      onSuccess();
      onClose();
    } else {
      toast.error(result.error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Nuovo Materiale</h2>
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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500"
              placeholder="Es: Linee guida Instagram Feed"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Content (Markdown) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contenuto (Markdown) *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 font-mono text-sm"
              placeholder="Usa **grassetto**, _corsivo_, liste, etc..."
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Supporta sintassi Markdown
            </p>
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={formData.item_type}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value as GuidelineItemType })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                           text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                <option value="permanent">Permanente</option>
                <option value="campaign">Campagna</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priorità
              </label>
              <div className="flex gap-2">
                {([0, 1, 2] as GuidelinePriority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority })}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-colors
                                ${formData.priority === priority
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}
                    disabled={isSubmitting}
                  >
                    <Star
                      className="w-4 h-4 mx-auto"
                      fill={priority > 0 ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Valid Until (for campaigns) */}
          {formData.item_type === 'campaign' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valida fino a (opzionale)
              </label>
              <input
                type="date"
                value={formData.valid_until?.split('T')[0] ?? ''}
                onChange={(e) => setFormData({
                  ...formData,
                  valid_until: e.target.value ? new Date(e.target.value).toISOString() : undefined
                })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                           text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destinatari
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, target_all: true })}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors
                            ${formData.target_all
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                disabled={isSubmitting}
              >
                Tutti gli artisti
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, target_all: false })}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors
                            ${!formData.target_all
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                disabled={isSubmitting}
              >
                Artisti specifici
              </button>
            </div>
            {!formData.target_all && (
              <p className="text-xs text-yellow-500 mt-2">
                ⚠️ Selezione artisti specifici: funzionalità in arrivo
              </p>
            )}
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
            {isSubmitting ? 'Creazione...' : 'Crea'}
          </button>
        </div>
      </div>
    </div>
  );
}
