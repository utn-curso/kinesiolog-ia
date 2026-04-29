import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { getApiErrorMessage } from '../services/api'

interface User {
  id: number
  email: string
  full_name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: { email: string; password: string; full_name: string; phone?: string; role?: string }) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const formData = new URLSearchParams()
          formData.append('username', email)
          formData.append('password', password)

          const response = await api.post('/auth/login', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })

          const { access_token } = response.data
          localStorage.setItem('token', access_token)
          set({ token: access_token, isLoading: false })
          await get().checkAuth()
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
        localStorage.removeItem('token')
        set({ user: null, token: null, error: null })
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
          const response = await api.get('/users/me')
          set({ user: response.data, token, error: null })
        } catch (error) {
          localStorage.removeItem('token')
          set({ user: null, token: null, error: null })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)