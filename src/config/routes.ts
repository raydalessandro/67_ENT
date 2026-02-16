// ============================================================================
// Route Paths
// ============================================================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CALENDAR: '/calendar',
  POST_DETAIL: '/posts/:id',
  POST_NEW: '/posts/new',
  TOOLKIT: '/toolkit',
  TOOLKIT_SECTION: '/toolkit/:slug',
  AI_CHAT: '/ai-chat',
  AI_CHAT_ADMIN: '/ai-chat/admin',
  AI_CHAT_ADMIN_ARTIST: '/ai-chat/admin/:artistId',
  AI_CHAT_ADMIN_SESSION: '/ai-chat/admin/:artistId/:sessionId',
  AI_CHAT_CONFIG: '/ai-chat/config/:artistId',
  AI_AGENTS_LIST: '/admin/ai-agents',
  AI_AGENT_CONFIG: '/admin/ai-agents/:artistId',
  ADMIN: '/admin',
  NOT_FOUND: '*',
} as const;

// Route builders (for navigation with params)
export const routes = {
  postDetail: (id: string) => `/posts/${id}`,
  toolkitSection: (slug: string) => `/toolkit/${slug}`,
  aiChatAdmin: (artistId: string) => `/ai-chat/admin/${artistId}`,
  aiChatAdminSession: (artistId: string, sessionId: string) =>
    `/ai-chat/admin/${artistId}/${sessionId}`,
  aiChatConfig: (artistId: string) => `/ai-chat/config/${artistId}`,
  aiAgentConfig: (artistId: string) => `/admin/ai-agents/${artistId}`,
} as const;
