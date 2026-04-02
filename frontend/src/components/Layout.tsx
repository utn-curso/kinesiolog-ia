import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/auth'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-black text-teal-500">
            Kine<span className="text-teal-50">Mov</span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-teal-500 font-semibold">
                  Dashboard
                </Link>
                <Link to="/agenda" className="text-gray-600 hover:text-teal-500 font-semibold">
                  Agenda
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-teal-500 font-semibold"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-teal-500 font-semibold">
                  Iniciar Sesión
                </Link>
                <Link to="/booking" className="btn-primary">
                  Reservar Turno
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}