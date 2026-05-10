import axios, { AxiosRequestConfig } from 'axios'

interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuthRedirect?: boolean
}

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

const getApiErrorMessage = (error: any): string => {
  if (!error) return 'Error inesperado. Intenta de nuevo.'

  if (error.response) {
    const status = error.response.status
    const detail = error.response.data?.detail

    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((item: any) => item.msg || JSON.stringify(item)).join('. ')
    }

    if (status >= 500) {
      return 'Error del servidor. Intenta nuevamente más tarde.'
    }

    if (status === 401) {
      return 'No autorizado. Por favor inicia sesión de nuevo.'
    }

    return `Error en la solicitud (${status}). Revisa los datos e intenta de nuevo.`
  }

  if (error.request) {
    const message = String(error.message || '')
    if (message.includes('Network Error')) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté disponible y que no haya un problema de CORS.'
    }
    if (message.includes('timeout')) {
      return 'La solicitud tardó demasiado. Intenta de nuevo en unos instantes.'
    }
    return 'Error de red. Revisa tu conexión e inténtalo nuevamente.'
  }

  return error.message || 'Error inesperado. Intenta de nuevo.'
}

const formatApiError = (error: any): any => {
  const message = getApiErrorMessage(error)
  return {
    ...error,
    message,
    apiMessage: message,
    status: error.response?.status,
    originalError: error,
  }
}

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const formattedError = formatApiError(error)
    const config = error.config as ApiRequestConfig | undefined
    if (formattedError.status === 401 && !config?.skipAuthRedirect) {
      window.location.href = '/login'
    }
    return Promise.reject(formattedError)
  }
)

export default api
export { getApiErrorMessage }

// User API functions
export const userApi = {
  getKinesiologos: () => api.get('/users/kinesiologos'),
  getKinesiologosProfiles: () => api.get('/users/kinesiologos-profiles'),
  updateMe: (data: { full_name?: string; phone?: string | null }) => api.put('/users/me', data),
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

  processPayment: (data: { appointment_id: number; amount: number; method: string }) =>
    api.post('/appointments/process-payment', data),
}

export interface TimeSlotPayload {
  /** YYYY-MM-DD */
  start_time: string
  /** YYYY-MM-DD */
  end_time: string
  /** HH:mm o HH:mm:ss (franja horaria) */
  start_hour: string
  end_hour: string
  is_available?: boolean
}

export const timeSlotApi = {
  listMine: (params?: { from_date?: string; to_date?: string }) =>
    api.get('/time-slots/me', { params }),

  create: (data: TimeSlotPayload) => api.post('/time-slots/me', data),

  update: (id: number, data: Partial<TimeSlotPayload>) =>
    api.put(`/time-slots/me/${id}`, data),

  delete: (id: number) => api.delete(`/time-slots/me/${id}`),
}

export const reportApi = {
  getDashboardSummary: (params?: { period?: 'week' | 'month' }) =>
    api.get('/reports/dashboard-summary', { params }),

  getMonthlyReport: (params: { year: number; month: number; kinesiologo_id?: number }) =>
    api.get('/reports/monthly', { params }),
    
  getCustomReport: (params: { period_start: string; period_end: string; kinesiologo_id?: number }) =>
    api.get('/reports/custom', { params }),

  getReportsList: (params?: { skip?: number; limit?: number; kinesiologo_id?: number }) =>
    api.get('/reports/', { params }),
}

export const notificationsApi = {
  getNotifications: () => api.get('/notifications/'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
}