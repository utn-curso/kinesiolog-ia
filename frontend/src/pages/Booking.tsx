import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

/** ISO sin sufijo Z (hora local del servidor/kinesiólogo): evita desfasar al interpretar como UTC. */
function parseSlotLocal(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(iso.trim())
  if (!m) return new Date(iso)
  const sec = m[6] != null ? Number(m[6]) : 0
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), sec)
}

export default function Booking() {
  const [kinesiologos, setKinesiologos] = useState<Kinesiologo[]>([])
  const [selectedKinesiologo, setSelectedKinesiologo] = useState<number | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<string>('Rehabilitación física')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([])
  const [appointmentDurationMin, setAppointmentDurationMin] = useState(60)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'mp' | 'cash' | 'card' | 'transfer'>('mp')
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvc: '' })
  
  const { user, checkAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Permitir acceso público a la página de booking
    // Solo requerir autenticación para confirmar la reserva
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          await checkAuth()
        }
      } catch (error) {
        // No redirigir a login, permitir vista pública
        console.log('Usuario no autenticado, permitiendo vista pública')
      } finally {
        setAuthChecked(true)
      }
    }
    initializeAuth()
  }, [checkAuth])

  useEffect(() => {
    // Cargar kinesiólogos inmediatamente, sin requerir autenticación
    if (authChecked) {
      loadKinesiologos()
    }
  }, [authChecked])

  useEffect(() => {
    // Restaurar estado de reserva pendiente si existe
    const pendingBooking = localStorage.getItem('pendingBooking')
    if (pendingBooking && user) {
      try {
        const bookingState = JSON.parse(pendingBooking)
        setSelectedKinesiologo(bookingState.selectedKinesiologo)
        setSelectedTreatment(bookingState.selectedTreatment)
        setSelectedDate(bookingState.selectedDate)
        setSelectedSlot(bookingState.selectedSlot)
        setNotes(bookingState.notes)
        setPaymentMethod(bookingState.paymentMethod)
        setStep(bookingState.step)
        localStorage.removeItem('pendingBooking')
      } catch (error) {
        console.error('Error restoring pending booking:', error)
      }
    }
  }, [user])

  useEffect(() => {
    setSelectedSlot(null)
  }, [selectedKinesiologo, selectedDate])

  const loadAvailableSlots = useCallback(async () => {
    if (!selectedKinesiologo || !selectedDate) return
    setLoading(true)
    try {
      const response = await appointmentApi.getAvailableSlots(selectedKinesiologo, selectedDate)
      const slots = response.data.available_slots as string[]
      setAvailableSlots(slots.map((slot: string) => ({ datetime: slot })))
      setAppointmentDurationMin(response.data.appointment_duration_minutes ?? 60)
      setSelectedSlot((prev) => (prev && slots.includes(prev) ? prev : null))
      setError('')
    } catch (error: any) {
      setError(error.apiMessage || error.message || 'Error al cargar los horarios disponibles.')
      setAvailableSlots([])
      setSelectedSlot(null)
    } finally {
      setLoading(false)
    }
  }, [selectedKinesiologo, selectedDate])

  useEffect(() => {
    if (selectedKinesiologo && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedKinesiologo, selectedDate, loadAvailableSlots])

  /** Al volver a la pestaña, actualizar huecos (otro usuario pudo reservar). */
  useEffect(() => {
    if (step !== 2) return
    const refresh = () => {
      if (selectedKinesiologo && selectedDate) loadAvailableSlots()
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [step, selectedKinesiologo, selectedDate, loadAvailableSlots])

  const loadKinesiologos = async () => {
    try {
      const response = await userApi.getKinesiologosProfiles()
      setKinesiologos(response.data)
      setError('')
    } catch (error: any) {
      setError(error.apiMessage || error.message || 'Error al cargar los kinesiólogos.')
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedKinesiologo || !selectedSlot) return

    // Requerir autenticación solo para confirmar la reserva
    if (!user) {
      // Guardar el estado actual en localStorage para restaurarlo después del login
      const bookingState = {
        selectedKinesiologo,
        selectedTreatment,
        selectedDate,
        selectedSlot,
        notes,
        paymentMethod,
        step: 3
      }
      localStorage.setItem('pendingBooking', JSON.stringify(bookingState))
      navigate('/login?redirect=booking')
      return
    }

    setBooking(true)
    try {
      // First, create the appointment
      const appointmentResponse = await appointmentApi.createAppointment({
        kinesiologo_id: selectedKinesiologo,
        date: selectedSlot,
        notes: `${selectedTreatment}${notes ? ` - ${notes}` : ''}`,
      })

      // Then, process payment (mock)
      await appointmentApi.processPayment({
        appointment_id: appointmentResponse.data.id,
        amount: 4500, // Fixed amount for demo
        method: paymentMethod
      })

      setStep(4)
    } catch (error: any) {
      setError(error.apiMessage || error.message || 'Error al reservar el turno.')
    } finally {
      setBooking(false)
    }
  }

  if (!authChecked) return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    </Layout>
  )

  const kinesiologo = kinesiologos.find(k => k.kinesiologo_id === selectedKinesiologo)

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link to="/" className="text-xl font-black text-teal-600">KineMov</Link>
        <div className="w-[1px] h-5 bg-slate-200"></div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Reservar turno</h2>
        {!user && (
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Vista pública - Login requerido solo para confirmar
          </div>
        )}
      </header>

      {step < 4 && (
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="max-w-2xl mx-auto flex items-center">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className={`text-[13px] font-bold ${step === 1 ? 'text-teal-600' : 'text-slate-400'}`}>Profesional</span>
            </div>
            <div className={`flex-1 h-[2px] mx-4 ${step > 1 ? 'bg-teal-600' : 'bg-slate-100'}`}></div>
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className={`text-[13px] font-bold ${step === 2 ? 'text-teal-600' : 'text-slate-400'}`}>Fecha y hora</span>
            </div>
            <div className={`flex-1 h-[2px] mx-4 ${step > 2 ? 'bg-teal-600' : 'bg-slate-100'}`}></div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                3
              </div>
              <span className={`text-[13px] font-bold ${step === 3 ? 'text-teal-600' : 'text-slate-400'}`}>Confirmación</span>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold">Error en el proceso de reserva</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}
        
        {step === 1 && (
          <Card className="p-10 animate-fade-in shadow-xl shadow-slate-100 border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Elegí tu kinesiólogo</h3>
            <p className="text-sm text-slate-500 mb-4">Seleccioná el profesional y el tratamiento para continuar</p>
            {!user && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 text-lg">ℹ️</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Vista pública disponible</p>
                    <p className="text-xs text-blue-700 mt-1">Podés explorar kinesiólogos y horarios sin registrarte. El login solo es requerido para confirmar tu reserva.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-8">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Profesional</label>
                <select 
                  value={selectedKinesiologo || ''}
                  onChange={(e) => setSelectedKinesiologo(Number(e.target.value) || null)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar kinesiólogo...</option>
                  {kinesiologos.map(k => (
                    <option key={k.kinesiologo_id} value={k.kinesiologo_id}>
                      {k.full_name} — {k.specialty || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Tratamiento</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['Rehabilitación física', 'Post-operatorio', 'Electroterapia', 'Pilates terapéutico'].map(t => (
                    <div 
                      key={t}
                      onClick={() => setSelectedTreatment(t)}
                      className={`border-2 rounded-2xl p-5 flex items-center gap-4 cursor-pointer font-black transition-all ${
                        selectedTreatment === t ? 'border-teal-500 bg-teal-50/50 text-teal-700 shadow-lg shadow-teal-50' : 'border-slate-100 hover:border-teal-200 bg-white text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{t.includes('Pilates') ? '🧘' : t.includes('Electro') ? '⚡' : t.includes('Post') ? '🦵' : '🤸'}</span>
                      <span className="text-sm">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-8 animate-fade-in shadow-xl shadow-slate-100 border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-1">Seleccioná fecha y horario</h3>
            <p className="text-sm text-slate-500 mb-2">
              Los horarios salen de la disponibilidad que cargó el kinesiólogo, en{' '}
              <span className="font-bold text-slate-700">bloques de 1 hora</span>; el día arranca el primer hueco en el
              mismo horario de inicio que definió el profesional. Los huecos ya ocupados no se muestran. Duración del
              turno:{' '}
              <span className="font-bold text-slate-700">{appointmentDurationMin} min</span>.
            </p>
            <p className="text-xs text-slate-400 mb-8">
              Si dejás la pestaña abierta y otro paciente reserva, al volver actualizamos la lista automáticamente.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Fecha del turno</label>
                <Input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]}
                  className="p-5 border-2 border-slate-100 rounded-2xl font-bold text-slate-700"
                />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-4">
                  Horarios disponibles — <span className="text-teal-600">{selectedDate || 'Seleccioná fecha'}</span>
                </h4>
                {loading ? (
                  <div className="text-slate-400 font-bold py-10 text-center animate-pulse">Cargando...</div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map(s => (
                      <div 
                        key={s.datetime}
                        onClick={() => setSelectedSlot(s.datetime)}
                        className={`border-2 rounded-xl p-3 text-center text-sm font-black cursor-pointer transition-all ${
                          selectedSlot === s.datetime ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-100 scale-105' : 'border-slate-100 hover:border-teal-300 bg-white text-slate-600'
                        }`}
                      >
                        {parseSlotLocal(s.datetime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-10 rounded-2xl text-center text-slate-400 font-bold border-2 border-dashed border-slate-200">
                    <p className="mb-2 text-slate-600">No hay horarios libres para esta fecha</p>
                    <p className="text-xs font-semibold normal-case text-slate-400">
                      El profesional puede no tener franjas cargadas para este día, o todos los huecos de {appointmentDurationMin} min ya están reservados.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-8 animate-fade-in shadow-xl shadow-slate-100 border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-1">Confirmá tu turno</h3>
            <p className="text-sm text-slate-500 mb-8">Revisá los datos y seleccioná el método de pago</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="bg-[#F8FAFB] border border-slate-200 rounded-2xl p-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Resumen del turno</h4>
                  <div className="space-y-4">
                    {[
                      { icon: '🩺', label: 'Profesional', val: kinesiologo?.full_name },
                      { icon: '🤸', label: 'Tratamiento', val: selectedTreatment },
                      { icon: '📅', label: 'Fecha y hora', val: `${parseSlotLocal(selectedSlot!).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} — ${parseSlotLocal(selectedSlot!).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` },
                      { icon: '⏱', label: 'Duración', val: `${appointmentDurationMin} minutos` },
                    ].map((row, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                          {row.icon}
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</div>
                          <div className="text-[13px] font-black text-slate-700">{row.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-black text-teal-600">$4.500</span>
                  </div>
                </div>
                
                <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-5 flex gap-4">
                  <span className="text-xl">📧</span>
                  <p className="text-[11px] font-black text-teal-700 leading-relaxed uppercase tracking-wider">
                    Recibirás confirmación por email y WhatsApp con el evento de Google Calendar adjunto.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Método de pago</h4>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { id: 'mp', icon: '💳', label: 'M. Pago' },
                      { id: 'card', icon: '🏦', label: 'Tarjeta' },
                      { id: 'transfer', icon: '📱', label: 'Transf.' },
                      { id: 'cash', icon: '💵', label: 'Efectivo' }
                    ].map(m => (
                      <div 
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`border-2 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all ${
                          paymentMethod === m.id ? 'border-teal-500 bg-teal-50/50 text-teal-700 shadow-md shadow-teal-50' : 'border-slate-100 hover:border-teal-200 bg-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === m.id ? 'border-teal-600 bg-teal-600' : 'border-slate-200'
                        }`}>
                          {paymentMethod === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">{m.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Details Area */}
                  <div className="bg-white border-2 border-slate-50 rounded-2xl p-5 mb-6 animate-fade-in">
                    {paymentMethod === 'card' && (
                      <div className="space-y-4">
                        <input 
                          type="text" placeholder="Número de tarjeta"
                          className="w-full p-3 border border-slate-100 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-teal-400 outline-none"
                          value={cardData.number}
                          onChange={e => setCardData({...cardData, number: e.target.value})}
                        />
                        <input 
                          type="text" placeholder="Nombre en tarjeta"
                          className="w-full p-3 border border-slate-100 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-teal-400 outline-none uppercase"
                          value={cardData.name}
                          onChange={e => setCardData({...cardData, name: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="MM/YY" className="p-3 border border-slate-100 rounded-xl text-sm font-bold bg-slate-50 outline-none text-center" value={cardData.expiry} onChange={e => setCardData({...cardData, expiry: e.target.value})} />
                          <input type="password" placeholder="CVC" className="p-3 border border-slate-100 rounded-xl text-sm font-bold bg-slate-50 outline-none text-center" value={cardData.cvc} onChange={e => setCardData({...cardData, cvc: e.target.value})} />
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'transfer' && (
                      <div className="text-center py-2">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-2">CBU / ALIAS</div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[13px] font-bold text-teal-700 select-all">
                          0000003100012345678901 <br />
                          KINEMOV.RESERVA.APP
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'mp' && (
                      <div className="flex items-center gap-3 text-blue-600 py-2">
                        <span className="text-2xl">📱</span>
                        <span className="text-xs font-bold leading-tight">Serás redirigido a la App de Mercado Pago para confirmar.</span>
                      </div>
                    )}
                    {paymentMethod === 'cash' && (
                      <div className="flex items-center gap-3 text-orange-600 py-2">
                        <span className="text-2xl">🏥</span>
                        <span className="text-xs font-bold leading-tight">Podrás abonar en la recepción al momento del turno.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Observaciones (opcional)</label>
                  <textarea 
                    className="w-full border-2 border-slate-100 rounded-2xl p-5 text-sm font-bold focus:border-teal-400 outline-none transition-all h-28 resize-none bg-slate-50/50"
                    placeholder="Ej: tengo obra social OSDE, zona de rodilla derecha..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-12 text-center animate-fade-in max-w-xl mx-auto mt-10 shadow-2xl shadow-teal-50 border-teal-100">
            <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">
              ✓
            </div>
            <h2 className="text-3xl font-black text-teal-600 mb-3 tracking-tight">¡Turno confirmado!</h2>
            <p className="text-slate-500 font-bold mb-10 leading-relaxed text-lg">
              Tu turno fue registrado correctamente. Te enviamos la confirmación por email y WhatsApp.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {['Email enviado', 'WhatsApp enviado', 'Google Calendar'].map(b => (
                <div key={b} className="bg-green-50 text-green-600 border border-green-100 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  <span className="text-green-500 text-lg">✓</span> {b}
                </div>
              ))}
            </div>

            <Button onClick={() => navigate('/dashboard')} className="w-full py-5 text-base font-black shadow-xl shadow-teal-100 rounded-2xl">
              Ir a mi Dashboard
            </Button>
          </Card>
        )}
      </main>

      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-10 py-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <button 
            onClick={() => step > 1 ? setStep((step - 1) as any) : navigate('/')}
            className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-teal-600 transition-colors"
          >
            ← Volver
          </button>
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hidden sm:block">Paso {step} de 3</div>
          <button 
            onClick={() => {
              if (step === 3) handleBookAppointment()
              else if (step === 1 && selectedKinesiologo) setStep(2)
              else if (step === 2 && selectedSlot) setStep(3)
            }}
            disabled={(step === 1 && !selectedKinesiologo) || (step === 2 && !selectedSlot) || booking}
            className="bg-teal-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 disabled:bg-slate-200 transition-all shadow-xl shadow-teal-100 flex items-center gap-3"
          >
            {booking ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Procesando...
              </div>
            ) : step === 3 ? 'Confirmar turno ✓' : 'Continuar →'}
          </button>
        </div>
      )}
    </div>
  )
}