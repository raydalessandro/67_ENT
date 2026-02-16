// ============================================================================
// App Layout — Shell with header, content area, bottom nav
// ============================================================================

import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from './OfflineIndicator';

export function AppLayout() {
  return (
    <div className="flex flex-col h-full min-h-[100dvh]">
      <OfflineIndicator />

      {/* Content — scrollable area. Each page manages its own header via <Header /> */}
      <main className="flex-1 overflow-y-auto scroll-container">
        <Outlet />
      </main>

      {/* Bottom nav — always visible (except homepage handles its own nav) */}
      <BottomNav />
    </div>
  );
}
