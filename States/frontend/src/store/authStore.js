import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (user, token) => {
        set({ user, token })
      },

      logout: () => {
        set({ user: null, token: null })
      },

      updateUser: (updates) => {
        set({ user: { ...get().user, ...updates } })
      },
    }),
    {
      name: 'hospital-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
