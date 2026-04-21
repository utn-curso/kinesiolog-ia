import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// User API functions
export const userApi = {
  getKinesiologos: () => api.get('/users/kinesiologos'),
  getKinesiologosProfiles: () => api.get('/users/kinesiologos-profiles'),
}
export const appointmentApi = {
  getAppointments: (params?: { skip?: number; limit?: number; status?: string }) =>
    api.get('/appointments/', { params }),

  getAppointment: (id: number) =>
    api.get(`/appointments/${id}`),

  createAppointment: (data: { kinesiologo_id: number; date: string; duration_minutes?: number; notes?: string }) =>
    api.post('/appointments/', data),

  updateAppointment: (id: number, data: { date?: string; duration_minutes?: number; status?: string; notes?: string }) =>
    api.put(`/appointments/${id}`, data),

  deleteAppointment: (id: number) =>
    api.delete(`/appointments/${id}`),

  getAvailableSlots: (kinesiologoId: number, date: string) =>
    api.get(`/appointments/available-slots/${kinesiologoId}?date=${date}`),
}