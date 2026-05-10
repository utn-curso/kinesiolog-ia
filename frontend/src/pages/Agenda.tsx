import { useEffect, useState } from 'react'
import { AdminLayout } from '../components/AdminLayout'
import { appointmentApi } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/auth'

interface Appointment {
  id: number;
  date: string;
  duration_minutes: number;
  status: string;
  notes?: string;
  patient?: { full_name: string };
  kinesiologo?: { user?: { full_name: string } };
  kinesiologo_id?: number;
}

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showEvolutionModal, setShowEvolutionModal] = useState(false)
  const [evolutionText, setEvolutionText] = useState('')
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleData, setRescheduleData] = useState({ date: '', slot: '' })
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isStaff = user?.role === 'admin' || user?.role === 'kinesiologo'

  const fetchAppointments = async () => {
    try {
      const { data } = await appointmentApi.getAppointments()
      const sorted = data.sort((a: Appointment, b: Appointment) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setAppointments(sorted)
    } catch (error: any) {
      console.error('Error al cargar los turnos de agenda:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    if (showRescheduleModal && selectedAppt && rescheduleData.date && selectedAppt.kinesiologo_id) {
      const fetchSlots = async () => {
        setLoadingSlots(true)
        try {
          const { data } = await appointmentApi.getAvailableSlots(selectedAppt.kinesiologo_id as number, rescheduleData.date)
          setAvailableSlots(data.available_slots)
        } catch (err) {
          console.error("Error fetching slots:", err)
          setAvailableSlots([])
        } finally {
          setLoadingSlots(false)
        }
      }
      fetchSlots()
    }
  }, [showRescheduleModal, rescheduleData.date, selectedAppt])

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  const weekStart = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return {
      name: d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''),
      date: d.getDate(),
      fullDate: d,
      isToday: d.toDateString() === new Date().toDateString()
    };
  });

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else if (view === 'month') d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else if (view === 'month') d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const now = new Date();
  const isPastPending = (app: Appointment) => app.status === 'pending' && new Date(app.date) < now;
  
  const getAppointmentLineClasses = (app: Appointment) => {
    if (isPastPending(app)) return 'border-l-[3px] border-red-500 bg-red-50';
    if (app.status === 'pending') return 'border-l-[3px] border-orange-500 bg-orange-50';
    if (app.status === 'cancelled') return 'border-l-[3px] border-red-500 bg-red-50';
    if (app.status === 'completed') return 'border-l-[3px] border-emerald-500 bg-emerald-50';
    return 'border-l-[3px] border-teal-500 bg-teal-50';
  }

  const getAppointmentTimeTextClass = (app: Appointment) => {
    if (isPastPending(app)) return 'text-red-600';
    if (app.status === 'pending') return 'text-orange-500';
    return 'text-teal-600';
  }

  const getAppointmentTagClasses = (app: Appointment) => {
    if (isPastPending(app)) return 'bg-red-50 text-red-600 border border-red-100';
    if (app.status === 'completed') return 'bg-emerald-50 text-emerald-700 border border-emerald-500';
    if (app.status === 'confirmed') return 'bg-teal-50 text-teal-700 border border-teal-500';
    if (app.status === 'pending') return 'bg-orange-50 text-orange-600 border border-orange-100';
    return 'bg-red-50 text-red-600 border border-red-100';
  }

  const getAppointmentStatusLabel = (app: Appointment) => {
    if (isPastPending(app)) return 'Perdido';
    if (app.status === 'completed') return 'Completado';
    if (app.status === 'confirmed') return 'Confirmado';
    if (app.status === 'pending') return 'Pendiente';
    if (app.status === 'cancelled') return 'Cancelado';
    return app.status;
  }

  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  
  const calAppts: Record<number, any[]> = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
  
  appointments.forEach(app => {
    const d = new Date(app.date);
    const start = new Date(weekStart);
    start.setHours(0,0,0,0);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    
    if (d >= start && d < end) {
      const jsDay = d.getDay(); 
      const col = jsDay === 0 ? 6 : jsDay - 1;

      const h = d.getHours();
      const m = d.getMinutes();
      const top = (h - 8) * 60 + m + 4;
      const height = (app.duration_minutes || 60) - 8; 
      
      const cls = getAppointmentLineClasses(app);

      calAppts[col].push({
        top,
        height,
        name: app.patient?.full_name || 'Paciente',
        time: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        treatment: app.notes || 'Consulta',
        cls,
        orig: app
      });
    }
  });

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      setActionLoading(true)
      await appointmentApi.updateAppointment(id, { status })
      const updated = appointments.map(a => a.id === id ? { ...a, status } : a)
      setAppointments(updated)
      if (selectedAppt && selectedAppt.id === id) {
        setSelectedAppt({ ...selectedAppt, status })
      }
      alert(`Turno ${status === 'cancelled' ? 'cancelado' : 'actualizado'} con éxito`)
    } catch (err: any) {
      alert(err.apiMessage || 'Error al actualizar el turno')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRegisterEvolution = () => {
    if (!selectedAppt) return
    setEvolutionText('')
    setShowEvolutionModal(true)
  }

  const handleSaveEvolution = async () => {
    if (!selectedAppt || !evolutionText.trim()) return
    try {
      setActionLoading(true)
      await appointmentApi.updateAppointment(selectedAppt.id, {
        status: 'completed',
        notes: (selectedAppt.notes ? selectedAppt.notes + "\n---\n" : "") + "EVOLUCIÓN (" + new Date().toLocaleDateString() + "): " + evolutionText.trim()
      })
      const { data } = await appointmentApi.getAppointments()
      setAppointments(data)
      setSelectedAppt(null)
      setShowEvolutionModal(false)
      alert("Evolución médica guardada correctamente. Turno finalizado.")
    } catch (err: any) {
      alert(err.apiMessage || 'Error al guardar la evolución')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendInstructions = () => {
    alert("Indicaciones y ejercicios enviados al correo del paciente correctamente.")
  }

  const monthTitle = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const dayTitle = currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AdminLayout pageTitle="Agenda Médica">
      {loading && appointments.length === 0 && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Sincronizando Agenda...</span>
          </div>
        </div>
      )}
      
      <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-[1400px] mx-auto min-h-[700px] relative">
        <div className="border-b border-slate-200 px-5 py-3 flex items-center gap-3 flex-wrap bg-white z-10 relative">
          <div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <button onClick={handlePrev} className="px-3 py-1.5 bg-white text-slate-500 hover:text-teal-600 font-bold text-[13px] border-r border-slate-200 transition-colors">‹</button>
            <button onClick={handleToday} className="px-4 py-1.5 bg-white text-slate-700 hover:bg-slate-50 font-bold text-[13px] border-r border-slate-200 transition-colors">Hoy</button>
            <button onClick={handleNext} className="px-3 py-1.5 bg-white text-slate-500 hover:text-teal-600 font-bold text-[13px] transition-colors">›</button>
          </div>
          <span className="text-[15px] font-extrabold text-slate-800 mx-2 capitalize">
            {view === 'day' ? dayTitle : view === 'week' ? `Semana ${weekDays[0].date} - ${weekDays[6].date} de ${monthTitle}` : monthTitle}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <button onClick={() => setView('day')} className={`px-4 py-1.5 font-bold text-[13px] border-r border-slate-200 transition-colors ${view === 'day' ? 'bg-slate-100 text-slate-900 font-black' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Día</button>
              <button onClick={() => setView('week')} className={`px-4 py-1.5 font-bold text-[13px] border-r border-slate-200 transition-colors ${view === 'week' ? 'bg-slate-100 text-slate-900 font-black' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Semana</button>
              <button onClick={() => setView('month')} className={`px-4 py-1.5 font-bold text-[13px] transition-colors ${view === 'month' ? 'bg-slate-100 text-slate-900 font-black' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Mes</button>
            </div>
            {(user?.role === 'patient' || user?.role === 'admin') && (
              <button
                type="button"
                onClick={() => navigate('/booking')}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-[13px] transition-colors shadow-sm"
              >
                + Nuevo turno
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <div className="w-[180px] lg:w-[220px] border-r border-slate-200 p-4 shrink-0 overflow-y-auto bg-white">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-3">Hoy — {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
            {appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length > 0 ? 
              appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).map((app, i) => (
                <div key={i} onClick={() => setSelectedAppt(app)} className={`${getAppointmentLineClasses(app)} p-2.5 rounded-r-lg mb-2.5 cursor-pointer hover:opacity-80 transition-opacity shadow-sm border border-slate-100`}>
                  <div className={`text-[11px] font-black ${getAppointmentTimeTextClass(app)}`}>{new Date(app.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight my-0.5">{app.patient?.full_name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{app.notes || 'Consulta'}</div>
                </div>
              )) : <div className="text-[13px] font-bold text-slate-400 italic mb-5">Sin turnos hoy</div>
            }

            <div className="h-px w-full bg-slate-200 my-5"></div>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-3">Próximos turnos</div>
            {appointments.filter(a => new Date(a.date) >= new Date()).slice(0, 5).map((app, i) => (
              <div key={i} onClick={() => setSelectedAppt(app)} className="mb-4 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  <span className="text-[11px] font-black text-slate-400 uppercase">{new Date(app.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="text-[13px] font-bold text-slate-700 leading-tight group-hover:text-teal-600 transition-colors">{app.patient?.full_name}</div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-auto bg-white flex flex-col relative min-w-[500px]">
            {view === 'month' ? (
              <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (<div key={d} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>))}
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-5 h-full">
                  {(() => {
                    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const firstDayIdx = (monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1);
                    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    return Array.from({ length: 35 }).map((_, i) => {
                      const dayNum = i - firstDayIdx + 1;
                      const dateObj = (dayNum > 0 && dayNum <= daysInMonth) ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum) : null;
                      const hasAppts = dateObj ? appointments.filter(a => new Date(a.date).toDateString() === dateObj.toDateString()) : [];
                      const isToday = dateObj?.toDateString() === new Date().toDateString();
                      return (
                        <div key={i} className={`border-r border-b border-slate-100 p-2 min-h-[120px] hover:bg-slate-50 transition-colors ${!dateObj ? 'bg-slate-50/30' : ''}`}>
                          {dateObj && (
                            <>
                              <div className={`text-sm font-black mb-2 ${isToday ? 'text-white bg-teal-600 w-7 h-7 rounded-full flex items-center justify-center -ml-1 shadow-md' : 'text-slate-400'}`}>{dayNum}</div>
                              <div className="space-y-1">
                                {hasAppts.slice(0, 3).map((app, j) => (
                                  <div key={j} onClick={() => setSelectedAppt(app)} className={`text-[9px] font-black px-1.5 py-0.5 rounded truncate border-l-2 cursor-pointer ${getAppointmentTagClasses(app)}`}>
                                    {new Date(app.date).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })} {app.patient?.full_name}
                                  </div>
                                ))}
                                {hasAppts.length > 3 && (
                                  <div className="text-[10px] font-black text-slate-400 pl-1 cursor-pointer hover:text-teal-600 transition-colors py-0.5 mt-0.5" onClick={(e) => { e.stopPropagation(); setCurrentDate(dateObj); setView('day'); }}>
                                    +{hasAppts.length - 3} más
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <>
                <div className="sticky top-0 z-20 flex bg-white border-b border-slate-200 shadow-sm">
                  <div className="w-[50px] border-r border-slate-200 shrink-0 bg-white"></div>
                  {weekDays.filter(d => view === 'week' || d.fullDate.toDateString() === currentDate.toDateString()).map((d, i) => (
                    <div key={i} className={`flex-1 text-center py-2.5 border-r border-slate-200 bg-white last:border-0 ${d.isToday ? 'border-b-[3px] border-b-teal-500 relative' : ''}`}>
                      <div className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider hidden sm:block">{d.name}</div>
                      <div className={`text-xl font-black leading-tight mt-0.5 ${d.isToday ? 'text-teal-600' : 'text-slate-800'}`}>{d.date}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-1 relative">
                  <div className="w-[50px] bg-white border-r border-slate-200 shrink-0 flex flex-col z-10">
                    {hours.map(h => (<div key={h} className="h-[60px] border-b border-slate-100 flex items-start justify-center pt-1.5 text-[10px] font-extrabold text-slate-400">{h}</div>))}
                  </div>
                  {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 text-slate-600 font-bold backdrop-blur-sm">Cargando turnos...</div>}
                  {weekDays.filter(d => view === 'week' || d.fullDate.toDateString() === currentDate.toDateString()).map((d, i) => (
                    <div key={i} className={`flex-1 border-r border-slate-200 relative overflow-hidden h-[600px] ${d.isToday ? 'bg-[#FAFFFE]' : 'bg-white'}`}>
                      {hours.map(h => <div key={h} className="h-[60px] border-b border-slate-100"></div>)}
                      {calAppts[weekDays.indexOf(d)]?.map((app, j) => (
                        <div key={j} onClick={() => setSelectedAppt(app.orig)} className={`absolute left-[3px] right-[3px] rounded-md px-2.5 py-1.5 cursor-pointer overflow-hidden transition-all duration-200 hover:brightness-95 hover:shadow-md ${app.cls}`} style={{ top: `${app.top}px`, height: `${app.height}px`, zIndex: 10 + j }}>
                          <div className={`text-[10px] font-black ${getAppointmentTimeTextClass(app.orig)}`}>{app.time}</div>
                          <div className="text-[13px] font-black text-slate-900 leading-tight my-0.5 truncate">{app.name}</div>
                          <div className="text-[10px] text-slate-600 font-medium truncate">{app.treatment}</div>
                        </div>
                      ))}
                      {d.isToday && (
                        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${(new Date().getHours() - 8) * 60 + new Date().getMinutes()}px` }}>
                          <div className="w-2.5 h-2.5 rounded-full bg-teal-500 absolute -left-[5px] -top-1 shadow-sm"></div>
                          <div className="absolute left-1 right-0 top-0 h-0.5 bg-teal-500 shadow-sm opacity-80"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {selectedAppt && (
            <div className="w-[300px] border-l border-slate-200 bg-white shrink-0 p-6 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.04)] z-30 absolute right-0 top-0 bottom-0 h-full overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-slate-800 text-[16px]">Detalle del turno</h4>
                <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-slate-800 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">&times;</button>
              </div>

              <div className="flex flex-col items-start mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-teal-100 border-2 border-white">
                  {(selectedAppt.patient?.full_name || 'NN').substring(0,2).toUpperCase()}
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{selectedAppt.patient?.full_name || 'Paciente'}</h3>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Turno de sistema #{selectedAppt.id}</span>
              </div>

              <div className="h-px bg-slate-100 w-full mb-6"></div>

              <div className="space-y-6 flex-1">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-lg shrink-0 border border-teal-100 shadow-sm">📅</div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Fecha y Hora</label>
                    <div className="text-[13px] font-bold text-slate-800 capitalize">
                      {new Date(selectedAppt.date).toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })}
                    </div>
                    <div className="text-[13px] font-black text-teal-600 mt-0.5">
                      {new Date(selectedAppt.date).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })} hs
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg shrink-0 border border-blue-100 shadow-sm">🤸</div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Motivo / Notas</label>
                    <div className="text-[13px] font-bold text-slate-800 leading-relaxed">{selectedAppt.notes || 'Consulta General'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0 border border-slate-200 shadow-sm">📊</div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Estado Actual</label>
                    <div className={`mt-1 inline-block px-3 py-1 rounded-lg text-[12px] font-black border ${getAppointmentTagClasses(selectedAppt)}`}>
                      {getAppointmentStatusLabel(selectedAppt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full mb-6 mt-6"></div>

              <div className="space-y-2.5">
                {selectedAppt.status !== 'cancelled' && selectedAppt.status !== 'completed' ? (
                  <>
                    {isStaff && (
                      <>
                        <button 
                          onClick={handleRegisterEvolution}
                          className="w-full py-3.5 bg-[#0D6E6E] hover:bg-[#0A5A5A] text-white text-[13px] font-black rounded-xl transition-all shadow-md shadow-teal-50 active:scale-[0.98]"
                        >
                          Registrar evolución
                        </button>
                        <button 
                          onClick={handleSendInstructions}
                          className="w-full py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[13px] font-black rounded-xl transition-all active:scale-[0.98]"
                        >
                          Enviar indicaciones
                        </button>
                        <button 
                          onClick={() => { setRescheduleData({ date: new Date(selectedAppt.date).toISOString().split('T')[0], slot: '' }); setShowRescheduleModal(true) }} 
                          className="w-full py-3.5 bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-600 text-[13px] font-black rounded-xl transition-all active:scale-[0.98]"
                        >
                          Reprogramar turno
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleUpdateStatus(selectedAppt.id, 'cancelled')}
                      className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 text-[13px] font-black rounded-xl transition-all active:scale-[0.98]"
                    >
                      Cancelar turno
                    </button>
                  </>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Turno {getAppointmentStatusLabel(selectedAppt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {showEvolutionModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800">Registrar Evolución</h3>
                <button onClick={() => setShowEvolutionModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">&times;</button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Notas de progreso clínico</label>
                  <textarea
                    value={evolutionText}
                    onChange={(e) => setEvolutionText(e.target.value)}
                    className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-none font-medium shadow-inner"
                    placeholder="Escribe aquí los avances detectados en la sesión..."
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowEvolutionModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">Cancelar</button>
                  <button 
                    onClick={handleSaveEvolution}
                    disabled={actionLoading || !evolutionText.trim()}
                    className="flex-1 py-3.5 bg-teal-600 text-white font-black rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {actionLoading ? 'Guardando...' : 'Guardar Evolución'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRescheduleModal && selectedAppt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg">📅</div>
                  <h3 className="text-lg font-black text-slate-800">Reprogramar Turno</h3>
                </div>
                <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">&times;</button>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">1. Nueva Fecha</label>
                    <input 
                      type="date"
                      value={rescheduleData.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value, slot: '' })}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all outline-none shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">2. Horarios Disponibles</label>
                    {loadingSlots ? (
                      <div className="flex flex-col items-center py-6 gap-3">
                        <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Buscando...</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {availableSlots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setRescheduleData({ ...rescheduleData, slot })}
                            className={`p-3 rounded-xl text-xs font-black transition-all border-2 ${
                              rescheduleData.slot === slot 
                                ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-100 scale-[1.02]' 
                                : 'bg-white border-slate-100 text-slate-600 hover:border-teal-200 hover:bg-teal-50/30'
                            }`}
                          >
                            {new Date(slot).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-6 rounded-2xl text-[11px] text-slate-400 font-bold text-center border-2 border-dashed border-slate-200">
                        {rescheduleData.date ? 'No hay horarios para este día' : 'Seleccioná una fecha primero'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-10 flex gap-4">
                  <button onClick={() => setShowRescheduleModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-[0.2em]">Cerrar</button>
                  <button 
                    onClick={async () => {
                      try {
                        setActionLoading(true)
                        await appointmentApi.updateAppointment(selectedAppt.id, { date: rescheduleData.slot })
                        await fetchAppointments()
                        setSelectedAppt(null)
                        setShowRescheduleModal(false)
                        alert('Turno reprogramado con éxito. Se ha enviado la notificación al paciente.')
                      } catch (err: any) {
                        alert(err.apiMessage || 'Error al reprogramar el turno')
                      } finally {
                        setActionLoading(false)
                      }
                    }}
                    disabled={actionLoading || !rescheduleData.slot}
                    className="flex-[1.5] py-4 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 text-xs uppercase tracking-[0.2em] disabled:opacity-50 active:scale-[0.98]"
                  >
                    {actionLoading ? 'Procesando...' : 'Confirmar Reprogramación'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}