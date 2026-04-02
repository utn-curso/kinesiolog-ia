import { Layout } from '../components/Layout'
import { Card } from '../components/Card'

export default function Booking() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Reservar Turno</h1>
          <p className="text-gray-600">Selecciona tu kinesiólogo y horario preferido</p>
        </div>

        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏗️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Funcionalidad en Desarrollo</h2>
            <p className="text-gray-600">
              El sistema de reserva de turnos estará disponible próximamente.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  )
}