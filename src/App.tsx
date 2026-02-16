// ============================================================================
// App — Router & Global Providers
// ============================================================================

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, StaffRoute } from '@/components/layout/RouteGuards';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/stores/featureFlags';
import { LoadingSpinner } from '@/components/ui/Primitives';
import { ROUTES } from '@/config/routes';
import { TOAST_DURATION } from '@/config/constants';
import './app.css';

// Pages — lazy loaded for code splitting
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const PostDetailPage = lazy(() => import('@/pages/PostDetailPage'));
const CreatePostPage = lazy(() => import('@/pages/CreatePostPage'));
const ToolkitPage = lazy(() => import('@/pages/ToolkitPage'));
const ToolkitSectionPage = lazy(() => import('@/pages/ToolkitSectionPage'));
const AIChatPageLazy = lazy(() => import('@/pages/AIChatPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AIAgentsListPage = lazy(() => import('@/pages/AIAgentsListPage'));
const AIAgentConfigPage = lazy(() => import('@/pages/AIAgentConfigPage'));
import { NotFoundPage } from '@/pages/PlaceholderPages';

function AppRoutes() {
  const { isLoading } = useAuth();
  const { aiChat } = useFeatureFlags();

  // Wait for auth to initialize before rendering routes
  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      {/* Protected — requires auth */}
      <Route element={<ProtectedRoute />}>
        {/* Homepage — no bottom nav (standalone landing) */}
        <Route path={ROUTES.HOME} element={<HomePage />} />

        {/* App pages — with bottom nav, lazy loaded */}
        <Route element={<AppLayout />}>
          <Route path={ROUTES.CALENDAR} element={<Suspense fallback={<LoadingSpinner />}><CalendarPage /></Suspense>} />
          <Route path={ROUTES.POST_DETAIL} element={<Suspense fallback={<LoadingSpinner />}><PostDetailPage /></Suspense>} />
          <Route path={ROUTES.TOOLKIT} element={<Suspense fallback={<LoadingSpinner />}><ToolkitPage /></Suspense>} />
          <Route path={ROUTES.TOOLKIT_SECTION} element={<Suspense fallback={<LoadingSpinner />}><ToolkitSectionPage /></Suspense>} />

          {/* AI Chat — conditional on feature flag */}
          {aiChat && (
            <Route path={ROUTES.AI_CHAT} element={<Suspense fallback={<LoadingSpinner />}><AIChatPageLazy /></Suspense>} />
          )}

          {/* Staff only */}
          <Route element={<StaffRoute />}>
            <Route path={ROUTES.POST_NEW} element={<Suspense fallback={<LoadingSpinner />}><CreatePostPage /></Suspense>} />
            <Route path={ROUTES.ADMIN} element={<Suspense fallback={<LoadingSpinner />}><AdminPage /></Suspense>} />
            <Route path={ROUTES.AI_AGENTS_LIST} element={<Suspense fallback={<LoadingSpinner />}><AIAgentsListPage /></Suspense>} />
            <Route path={ROUTES.AI_AGENT_CONFIG} element={<Suspense fallback={<LoadingSpinner />}><AIAgentConfigPage /></Suspense>} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster
        position="top-center"
        duration={TOAST_DURATION}
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />
    </ErrorBoundary>
  );
}
