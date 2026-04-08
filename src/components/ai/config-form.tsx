'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import type { AiAgentConfig } from '@/types/models'
import type { UpdateAiConfigInput } from '@/types/api'

interface AiConfigFormProps {
  config: AiAgentConfig
  onSave: (input: UpdateAiConfigInput) => Promise<void>
  isSaving: boolean
}

const PROMPT_FIELDS: Array<{
  key: keyof UpdateAiConfigInput
  label: string
  placeholder: string
}> = [
  {
    key: 'system_prompt_identity',
    label: 'Identità',
    placeholder: "Descrivi chi è l'assistente AI…",
  },
  {
    key: 'system_prompt_activity',
    label: 'Attività',
    placeholder: "Descrivi le attività dell'assistente…",
  },
  {
    key: 'system_prompt_ontology',
    label: 'Ontologia',
    placeholder: 'Definisci il framework concettuale…',
  },
  {
    key: 'system_prompt_marketing',
    label: 'Marketing',
    placeholder: 'Istruzioni per il contesto marketing…',
  },
  {
    key: 'system_prompt_boundaries',
    label: 'Limiti',
    placeholder: "Definisci cosa l'assistente NON deve fare…",
  },
  {
    key: 'system_prompt_extra',
    label: 'Extra',
    placeholder: 'Istruzioni aggiuntive…',
  },
]

export function AiConfigForm({ config, onSave, isSaving }: AiConfigFormProps) {
  const [form, setForm] = useState<UpdateAiConfigInput>({
    is_enabled: config.is_enabled,
    provider: config.provider,
    model_name: config.model_name,
    temperature: config.temperature,
    max_tokens: config.max_tokens,
    daily_message_limit: config.daily_message_limit,
    system_prompt_identity: config.system_prompt_identity,
    system_prompt_activity: config.system_prompt_activity,
    system_prompt_ontology: config.system_prompt_ontology,
    system_prompt_marketing: config.system_prompt_marketing,
    system_prompt_boundaries: config.system_prompt_boundaries,
    system_prompt_extra: config.system_prompt_extra,
  })

  function setField<K extends keyof UpdateAiConfigInput>(key: K, value: UpdateAiConfigInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg bg-[#0F0F1A] border border-[#1E1E30] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Assistente AI Abilitato</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Attiva o disattiva la chat AI per questo artista
          </p>
        </div>
        <button
          type="button"
          onClick={() => setField('is_enabled', !form.is_enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#F5C518]/30 ${
            form.is_enabled ? 'bg-[#F5C518]' : 'bg-[#1E1E30]'
          }`}
          aria-pressed={form.is_enabled}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              form.is_enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Provider & Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Provider
          </label>
          <select
            value={form.provider ?? ''}
            onChange={(e) => setField('provider', e.target.value)}
            className="rounded-lg bg-[#0F0F1A] border border-[#1E1E30] px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#F5C518]/50 transition-colors"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Modello
          </label>
          <input
            type="text"
            value={form.model_name ?? ''}
            onChange={(e) => setField('model_name', e.target.value)}
            placeholder="es. gpt-4o, claude-3-5-sonnet…"
            className="rounded-lg bg-[#0F0F1A] border border-[#1E1E30] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#F5C518]/50 transition-colors"
          />
        </div>
      </div>

      {/* Temperature, max tokens, daily limit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Temperatura{' '}
            <span className="text-[#F5C518] font-black">{(form.temperature ?? 0).toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={form.temperature ?? 0}
            onChange={(e) => setField('temperature', parseFloat(e.target.value))}
            className="accent-[#F5C518] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Preciso</span>
            <span>Creativo</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Max Token
          </label>
          <input
            type="number"
            min={1}
            value={form.max_tokens ?? ''}
            onChange={(e) => setField('max_tokens', parseInt(e.target.value, 10))}
            className="rounded-lg bg-[#0F0F1A] border border-[#1E1E30] px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#F5C518]/50 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Limite Giornaliero
          </label>
          <input
            type="number"
            min={1}
            value={form.daily_message_limit ?? ''}
            onChange={(e) => setField('daily_message_limit', parseInt(e.target.value, 10))}
            className="rounded-lg bg-[#0F0F1A] border border-[#1E1E30] px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#F5C518]/50 transition-colors"
          />
        </div>
      </div>

      {/* System prompt textareas */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Prompt di Sistema
        </h3>
        {PROMPT_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-300">{label}</label>
            <textarea
              rows={4}
              value={(form[key] as string) ?? ''}
              onChange={(e) => setField(key, e.target.value)}
              placeholder={placeholder}
              className="rounded-lg bg-[#0F0F1A] border border-[#1E1E30] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 resize-y focus:outline-none focus:border-[#F5C518]/50 transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-[#F5C518] text-black text-sm font-bold px-5 py-2.5 hover:bg-[#e6b800] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={16} />
          {isSaving ? 'Salvataggio…' : 'Salva Configurazione'}
        </button>
      </div>
    </form>
  )
}
