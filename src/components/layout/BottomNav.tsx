// ============================================================================
// Bottom Navigation (Mobile)
// ============================================================================

import { NavLink } from 'react-router-dom';
import { Calendar, BookOpen, Bot, Home } from 'lucide-react';
import { useFeatureFlags } from '@/stores/featureFlags';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

export function BottomNav() {
  const { aiChat } = useFeatureFlags();

  const items: NavItem[] = [
    { to: ROUTES.HOME, icon: Home, label: 'Home' },
    { to: ROUTES.CALENDAR, icon: Calendar, label: 'Calendario' },
    { to: ROUTES.TOOLKIT, icon: BookOpen, label: 'Materiali' },
  ];

  if (aiChat) {
    items.push({ to: ROUTES.AI_CHAT, icon: Bot, label: 'AI' });
  }

  return (
    <nav
      className="sticky bottom-0 z-40 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROUTES.HOME}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[64px]',
                'text-xs font-medium transition-colors',
                isActive ? 'text-indigo-400' : 'text-gray-500',
              )
            }
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5', isActive && 'text-indigo-400')} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
