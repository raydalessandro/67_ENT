// ============================================================================
// Auth Store (Zustand)
// ============================================================================

import { create } from 'zustand';
import type { User, Artist } from '@/types/models';

interface AuthState {
  user: User | null;
  artist: Artist | null;
  isStaff: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setArtist: (artist: Artist | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  artist: null,
  isStaff: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isStaff: user?.role === 'admin' || user?.role === 'manager',
      isLoading: false,
    }),

  setArtist: (artist) => set({ artist }),

  logout: () =>
    set({
      user: null,
      artist: null,
      isStaff: false,
      isLoading: false,
    }),
}));
