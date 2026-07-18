import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { refreshToken } from '@/api/auth'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshTokenValue: null,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshTokenValue: refresh }),

      setUser: (user) => set({ user }),

      refresh: async () => {
        const token = get().refreshTokenValue
        if (!token) return false
        try {
          const { data } = await refreshToken(token)
          set({ accessToken: data.access })
          return true
        } catch {
          set({ user: null, accessToken: null, refreshTokenValue: null })
          return false
        }
      },

      logout: () =>
        set({ user: null, accessToken: null, refreshTokenValue: null }),

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'presfor-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshTokenValue: s.refreshTokenValue,
        user: s.user,
      }),
    }
  )
)
