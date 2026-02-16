// ============================================================================
// Validation Schemas (Zod)
// ============================================================================

import { z } from 'zod';
import { POST_PLATFORMS, GUIDELINE_ITEM_TYPES } from '@/types/enums';
import { AI_MAX_MESSAGE_LENGTH } from '@/config/constants';

export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password obbligatoria'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const postSchema = z.object({
  title: z.string().min(1, 'Titolo obbligatorio').max(200, 'Max 200 caratteri'),
  caption: z.string().max(2200, 'Max 2200 caratteri').optional().or(z.literal('')),
  hashtags: z.string().max(500, 'Max 500 caratteri').optional().or(z.literal('')),
  platform: z.enum(POST_PLATFORMS, { error: 'Piattaforma obbligatoria' }),
  artist_id: z.string().uuid('Seleziona un artista'),
  scheduled_at: z.string().min(1, 'Data obbligatoria').refine(
    (val) => new Date(val) > new Date(),
    'La data deve essere futura',
  ),
});
export type PostInput = z.infer<typeof postSchema>;

export const rejectSchema = z.object({
  reason: z.string().min(1, 'Motivo obbligatorio').max(500, 'Max 500 caratteri'),
});
export type RejectInput = z.infer<typeof rejectSchema>;

export const commentSchema = z.object({
  content: z.string().min(1, 'Commento obbligatorio').max(1000, 'Max 1000 caratteri'),
});
export type CommentInput = z.infer<typeof commentSchema>;

export const guidelineItemSchema = z.object({
  title: z.string().min(1, 'Titolo obbligatorio').max(200, 'Max 200 caratteri'),
  content: z.string().min(1, 'Contenuto obbligatorio'),
  item_type: z.enum(GUIDELINE_ITEM_TYPES),
  priority: z.coerce.number().min(0).max(2).default(0),
  valid_from: z.string().optional().or(z.literal('')),
  valid_until: z.string().optional().or(z.literal('')),
  target_all: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.valid_from && data.valid_until) {
      return new Date(data.valid_from) < new Date(data.valid_until);
    }
    return true;
  },
  { message: 'La data di inizio deve essere prima della fine', path: ['valid_until'] },
);
export type GuidelineItemInput = z.infer<typeof guidelineItemSchema>;

export const aiMessageSchema = z.object({
  message: z.string()
    .min(1, 'Scrivi un messaggio')
    .max(AI_MAX_MESSAGE_LENGTH, `Max ${AI_MAX_MESSAGE_LENGTH} caratteri`),
});
export type AIMessageInput = z.infer<typeof aiMessageSchema>;

export const agentConfigSchema = z.object({
  is_enabled: z.boolean(),
  model: z.string().default('deepseek-chat'),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  max_tokens: z.coerce.number().min(100).max(4096).default(1024),
  daily_message_limit: z.coerce.number().min(1).max(100).default(20),
  prompt_identity: z.string().max(3000).optional().or(z.literal('')),
  prompt_activity: z.string().max(3000).optional().or(z.literal('')),
  prompt_ontology: z.string().max(3000).optional().or(z.literal('')),
  prompt_marketing: z.string().max(3000).optional().or(z.literal('')),
  prompt_boundaries: z.string().max(3000).optional().or(z.literal('')),
  prompt_extra: z.string().max(3000).optional().or(z.literal('')),
});
export type AgentConfigInput = z.infer<typeof agentConfigSchema>;
