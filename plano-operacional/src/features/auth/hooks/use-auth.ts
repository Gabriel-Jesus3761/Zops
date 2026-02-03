import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
// import { signOut } from 'firebase/auth' // Temporariamente desabilitado
// import { auth } from '@/config/firebase' // Temporariamente desabilitado
import type { User, AuthToken, Permission } from '../types'

interface AuthStore {
  user: User | null
  token: AuthToken | null
  pipeId: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: User | null) => void
  setToken: (token: string, expirationHours?: number) => void
  setPipeId: (pipeId: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  checkTokenExpiration: () => boolean
  hasPermission: (requiredPermissions: Permission[]) => boolean
}

const TOKEN_EXPIRATION_HOURS = 6

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      pipeId: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: (tokenValue, expirationHours = TOKEN_EXPIRATION_HOURS) => {
        const token: AuthToken = {
          token: tokenValue,
          expirationDate: Date.now() + expirationHours * 60 * 60 * 1000,
        }
        set({ token })
      },

      setPipeId: (pipeId) => set({ pipeId }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: async () => {
        // ⚠️ TEMPORÁRIO: Firebase signOut desabilitado
        // TODO: Descomentar quando Firebase Auth estiver funcionando
        // Ver: plano-operacional/SEGURANCA_PRODUCAO.md

        // try {
        //   await signOut(auth)
        //   console.log('✅ Deslogado do Firebase Auth')
        // } catch (error) {
        //   console.error('⚠️ Erro ao deslogar do Firebase:', error)
        // }

        // Limpar store local
        set({
          user: null,
          token: null,
          pipeId: null,
          isAuthenticated: false,
        })
      },

      checkTokenExpiration: () => {
        const { token, logout } = get()
        if (!token) return false

        if (Date.now() > token.expirationDate) {
          logout()
          return false
        }

        return true
      },

      hasPermission: (requiredPermissions) => {
        const { user } = get()
        if (!user) return false

        return requiredPermissions.includes(user.permission)
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        pipeId: state.pipeId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Selectors
export const selectUser = (state: AuthStore) => state.user
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated
export const selectPipeId = (state: AuthStore) => state.pipeId
export const selectIsLoading = (state: AuthStore) => state.isLoading
