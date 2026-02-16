// ============================================================================
// Route Guards
// ============================================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/Primitives';
import { ROUTES } from '@/config/routes';

/** Requires authenticated user. Redirects to login if not. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/** Requires staff role (admin or manager). Redirects to home if not. */
export function StaffRoute() {
  const { isStaff } = useAuthStore();

  if (!isStaff) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
