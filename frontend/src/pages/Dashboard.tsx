import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/auth'
import { Layout } from '../components/Layout'
import { Card } from '../components/Card'

export default function Dashboard() {
  const { user, checkAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      checkAuth()
    }
  }, [user, checkAuth])

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            ¡Hola, {user.full_name}!
          </h1>
          <p className="text-gray-600">
            Bienvenido a tu panel de control
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">📅</span>
              </div>
              <div>
                <div className="text-2xl font-black text-teal-500">3</div>
                <div className="text-sm text-gray-600">Turnos Hoy</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">⏰</span>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-500">12</div>
                <div className="text-sm text-gray-600">Turnos Semana</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <div className="text-2xl font-black text-green-500">8</div>
                <div className="text-sm text-gray-600">Completados</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coral-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <div className="text-2xl font-black text-coral-500">$2,400</div>
                <div className="text-sm text-gray-600">Ingresos Mes</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Próximos Turnos</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-900">María González</div>
                  <div className="text-sm text-gray-600">Fisioterapia - 10:00 AM</div>
                </div>
                <div className="text-sm text-teal-600 font-semibold">Hoy</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-900">Carlos Rodríguez</div>
                  <div className="text-sm text-gray-600">Masaje - 2:30 PM</div>
                </div>
                <div className="text-sm text-teal-600 font-semibold">Hoy</div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/booking')}
                className="p-4 bg-teal-50 hover:bg-teal-100 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="text-sm font-semibold text-teal-700">Nuevo Turno</div>
              </button>

              <button
                onClick={() => navigate('/agenda')}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-semibold text-blue-700">Ver Agenda</div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}