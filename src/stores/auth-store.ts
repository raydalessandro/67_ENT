import { create } from 'zustand'
import type { User, Artist } from '@/types/models'

interface AuthState {
  user: User | null
  artist: Artist | null
  isLoading: boolean
  isStaff: boolean    // computed: role === 'admin' || role === 'manager'
  isAdmin: boolean    // computed: role === 'admin'
  setUser(user: User | null): void
  setArtist(artist: Artist | null): void
  setLoading(loading: boolean): void
  reset(): void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  artist: null,
  isLoading: true,
  isStaff: false,
  isAdmin: false,
  setUser: (user) => set({
    user,
    isStaff: user?.role === 'admin' || user?.role === 'manager',
    isAdmin: user?.role === 'admin',
  }),
  setArtist: (artist) => set({ artist }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, artist: null, isLoading: false, isStaff: false, isAdmin: false }),
}))
