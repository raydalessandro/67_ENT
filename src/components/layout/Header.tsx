// ============================================================================
// Header
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title, showBack = false }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header
      className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 p-1 -ml-1 text-gray-400 hover:text-white transition-colors"
              aria-label="Indietro"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => {/* TODO: open notifications panel */}}
            className="relative p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Notifiche"
            data-testid="notifications-button"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* User menu / Logout */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Esci"
            data-testid="logout-button"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.display_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <LogOut className="w-4 h-4 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
