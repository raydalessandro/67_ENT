import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  isOffline: boolean
  setSidebarOpen(open: boolean): void
  setOffline(offline: boolean): void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  isOffline: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setOffline: (isOffline) => set({ isOffline }),
}))
