// ============================================================================
// Feature Flags Store (Zustand)
// ============================================================================

import { create } from 'zustand';
import { env } from '@/config/env';

interface FeatureFlags {
  aiChat: boolean;
  toolkit: boolean;
  notifications: boolean;
}

export const useFeatureFlags = create<FeatureFlags>(() => ({
  aiChat: env.featureAIChat,
  toolkit: true,
  notifications: true,
}));
