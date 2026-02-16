// ============================================================================
// Homepage — 67 Entertainment
// ============================================================================

import { Link } from 'react-router-dom';
import { Calendar, BookOpen, Bot, ChevronRight, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/stores/featureFlags';
import { LABEL_NAME } from '@/config/constants';
import { ROUTES } from '@/config/routes';

interface NavItem {
  icon: React.ElementType;
  label: string;
  description: string;
  to: string;
  show: boolean;
}

export default function HomePage() {
  const { user, isStaff } = useAuth();
  const { aiChat } = useFeatureFlags();

  const navItems: NavItem[] = [
    {
      icon: Calendar,
      label: 'Calendario',
      description: 'Post programmati e approvazioni',
      to: ROUTES.CALENDAR,
      show: true,
    },
    {
      icon: BookOpen,
      label: 'Consigli & Materiali',
      description: 'Linee guida e best practice',
      to: ROUTES.TOOLKIT,
      show: true,
    },
    {
      icon: Bot,
      label: 'Assistente AI',
      description: 'Consulenza strategica personalizzata',
      to: ROUTES.AI_CHAT,
      show: aiChat,
    },
    {
      icon: Settings,
      label: 'Gestione Artisti',
      description: 'Crea account, credenziali, impostazioni',
      to: ROUTES.ADMIN,
      show: isStaff,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-gray-950">
      {/* Label name */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.2em] text-white mb-6 text-center">
        {LABEL_NAME}
      </h1>

      {/* Logo */}
      <div className="w-28 h-28 sm:w-32 sm:h-32 mb-10 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden">
        {/* Replace with actual logo: <img src="/logo-67.png" alt="67 Entertainment" /> */}
        <span className="text-4xl font-black text-indigo-400">67</span>
      </div>

      {/* Navigation buttons */}
      <div className="w-full max-w-sm space-y-3">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-4 w-full p-4 rounded-xl
                         bg-white/5 border border-white/10
                         hover:bg-white/10 active:scale-[0.98]
                         text-white transition-all"
              data-testid={`home-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-gray-400 truncate">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
            </Link>
          ))}
      </div>

      {/* Greeting */}
      <p className="mt-10 text-gray-500 text-sm">
        Ciao, {user?.display_name ?? 'benvenuto'}
      </p>
    </div>
  );
}
