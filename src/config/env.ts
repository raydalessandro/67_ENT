// ============================================================================
// Environment Variables (typed)
// ============================================================================

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('VITE_SUPABASE_ANON_KEY'),
  featureAIChat: import.meta.env.VITE_FEATURE_AI_CHAT === 'true',
} as const;
