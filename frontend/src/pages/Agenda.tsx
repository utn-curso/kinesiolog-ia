import { Layout } from '../components/Layout'
import { Card } from '../components/Card'

export default function Agenda() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Mi Agenda</h1>
          <p className="text-gray-600">Gestiona tus turnos y horarios</p>
        </div>

        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Agenda en Desarrollo</h2>
            <p className="text-gray-600">
              La vista de agenda estará disponible próximamente.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  )
}