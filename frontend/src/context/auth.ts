import { create } from 'zustand'
import api, { getApiErrorMessage } from '../services/api'

interface User {
  id: number
  email: string
  full_name: string
  phone?: string | null
  role: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: { email: string; password: string; full_name: string; phone?: string; role?: string }) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const formData = new URLSearchParams()
          formData.append('username', email)
          formData.append('password', password)

          await api.post('/auth/login', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })

          await get().checkAuth()
          set({ isLoading: false })
        } catch (error: any) {
          const errorMessage = getApiErrorMessage(error)
          set({ isLoading: false, error: errorMessage })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/register', userData)
          set({ isLoading: false })
        } catch (error: any) {
          const errorMessage = getApiErrorMessage(error)
          set({ isLoading: false, error: errorMessage })
          throw error
        }
      },

      logout: () => {
        api.post('/auth/logout').catch(() => {})
        set({ user: null, error: null })
      },

      checkAuth: async () => {
        try {
          const response = await api.get('/users/me', { skipAuthRedirect: true } as any)
          set({ user: response.data, error: null })
        } catch (error) {
          set({ user: null, error: null })
        }
      },
}))