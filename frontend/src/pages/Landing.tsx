import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'

export default function Landing() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-600 font-bold text-sm px-4 py-2 rounded-full mb-6">
                <span>🏥</span>
                Cuidado Profesional
              </div>
              <h1 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
                Tu salud en las mejores
                <span className="text-teal-500"> manos</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Conecta con kinesiólogos certificados y reserva tu turno de manera fácil y rápida.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/booking">
                  <Button>Reservar Turno</Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary">Soy Profesional</Button>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="text-3xl font-black text-teal-500">500+</div>
                  <div className="text-sm text-gray-600">Pacientes Atendidos</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="text-3xl font-black text-blue-500">50+</div>
                  <div className="text-sm text-gray-600">Profesionales</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="text-3xl font-black text-green-500">4.9</div>
                  <div className="text-sm text-gray-600">Calificación</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-coral-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="text-3xl font-black text-coral-500">24/7</div>
                  <div className="text-sm text-gray-600">Disponibilidad</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Servicios Especializados
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tratamientos personalizados para tu recuperación y bienestar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🦴</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fisioterapia</h3>
              <p className="text-gray-600">
                Recupera movilidad y fuerza con técnicas especializadas en lesiones musculares y articulares.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💆‍♀️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Masajes Terapéuticos</h3>
              <p className="text-gray-600">
                Alivia tensiones musculares y mejora la circulación con masajes profesionales.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🏃‍♂️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rehabilitación</h3>
              <p className="text-gray-600">
                Programas personalizados para recuperación post-quirúrgica y lesiones deportivas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}