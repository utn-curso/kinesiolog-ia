import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/auth'
import { Layout } from '../components/Layout'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { appointmentApi, userApi } from '../services/api'

interface Kinesiologo {
  kinesiologo_id: number
  user_id: number
  full_name: string
  email: string
  specialty: string | null
}

interface Slot {
  datetime: string
}

export default function Booking() {
  const [kinesiologos, setKinesiologos] = useState<Kinesiologo[]>([])
  const [selectedKinesiologo, setSelectedKinesiologo] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const { user, checkAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const initializeAuth = async () => {
        try {
          await checkAuth()
        } catch (error) {
          navigate('/login')
        } finally {
          setAuthChecked(true)
        }
      }

      initializeAuth()
      return
    }

    setAuthChecked(true)
  }, [user, checkAuth, navigate])

  useEffect(() => {
    if (authChecked && user) {
      loadKinesiologos()
    }
  }, [authChecked, user])

  useEffect(() => {
    if (selectedKinesiologo && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedKinesiologo, selectedDate])

  const loadKinesiologos = async () => {
    try {
      const response = await userApi.getKinesiologosProfiles()
      setKinesiologos(response.data)
    } catch (error) {
      console.error('Error loading kinesiologos:', error)
    }
  }

  const loadAvailableSlots = async () => {
    if (!selectedKinesiologo || !selectedDate) return

    setLoading(true)
    try {
      const response = await appointmentApi.getAvailableSlots(selectedKinesiologo, selectedDate)
      setAvailableSlots(response.data.available_slots.map((slot: string) => ({ datetime: slot })))
    } catch (error) {
      console.error('Error loading slots:', error)
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedKinesiologo || !selectedSlot) return

    setBooking(true)
    try {
      await appointmentApi.createAppointment({
        kinesiologo_id: selectedKinesiologo,
        date: selectedSlot,
        notes: notes || undefined,
      })
      alert('Turno reservado exitosamente!')
      // Reset form
      setSelectedKinesiologo(null)
      setSelectedDate('')
      setAvailableSlots([])
      setSelectedSlot(null)
      setNotes('')
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Error al reservar el turno')
    } finally {
      setBooking(false)
    }
  }

  if (!authChecked) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando sesión...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Reservar Turno</h1>
          <p className="text-gray-600">Selecciona tu kinesiólogo y horario preferido</p>
        </div>

        <Card>
          <div className="space-y-6">
            {/* Kinesiologo Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Kinesiólogo
              </label>
              <select
                value={selectedKinesiologo || ''}
                onChange={(e) => setSelectedKinesiologo(Number(e.target.value) || null)}
                className="input-field"
              >
                <option value="">Seleccionar...</option>
                {kinesiologos.map((kine) => (
                  <option key={kine.kinesiologo_id} value={kine.kinesiologo_id}>
                    {kine.full_name}{kine.specialty ? ` - ${kine.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Fecha
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Available Slots */}
            {selectedKinesiologo && selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horarios Disponibles
                </label>
                {loading ? (
                  <p>Cargando horarios...</p>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.datetime}
                        onClick={() => setSelectedSlot(slot.datetime)}
                        className={`p-2 border rounded ${
                          selectedSlot === slot.datetime
                            ? 'bg-teal-500 text-white border-teal-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-teal-500'
                        }`}
                      >
                        {new Date(slot.datetime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>No hay horarios disponibles para esta fecha.</p>
                )}
              </div>
            )}

            {/* Notes */}
            {selectedSlot && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Describe tus síntomas o necesidades..."
                />
              </div>
            )}

            {/* Book Button */}
            {selectedSlot && (
              <div className="text-center">
                <Button
                  onClick={handleBookAppointment}
                  disabled={booking}
                  className="btn-primary"
                >
                  {booking ? 'Reservando...' : 'Reservar Turno'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}