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
}

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await appointmentApi.getAppointments()
        const sorted = data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setAppointments(sorted)
      } catch (error) {
        console.error('Error fetching agenda appointments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [])

  // Helper to get start of week (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  // Generate days for the week view based on currentDate
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

  // Navigation Logic
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

  const handleToday = () => setCurrentDate(new Date());

  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  
  // Mapping appointments for the current view
  const calAppts: Record<number, any[]> = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
  
  appointments.forEach(app => {
    const d = new Date(app.date);
    
    // Only process if it belongs to current week (for week/day view)
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
      
      let cls = 'border-l-[3px] border-teal-500 bg-teal-50';
      if(app.status === 'pending') cls = 'border-l-[3px] border-orange-500 bg-orange-50';
      if(app.status === 'cancelled') cls = 'border-l-[3px] border-red-500 bg-red-50';

      const appData = {
        orig: app,
        top,
        height,
        cls,
        time: `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`,
        name: app.patient?.full_name || 'Paciente',
        treatment: app.notes || 'Consulta'
      };

      if (view === 'week') {
        calAppts[col].push(appData);
      } else if (view === 'day' && d.toDateString() === currentDate.toDateString()) {
        calAppts[col].push(appData);
      }
    }
  });

  const monthTitle = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const dayTitle = currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AdminLayout 
      pageTitle="Agenda"
      topbarRight={
        <div className="flex items-center gap-2 text-[13px] font-bold text-slate-500">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-teal-400 text-white flex items-center justify-center font-extrabold text-[11px]">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          {user?.full_name || 'Usuario Activo'}
        </div>
      }
    >
      <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-[1400px] mx-auto min-h-[700px] relative">
        
        {/* TOOLBAR */}
        <div className="border-b border-slate-200 px-5 py-3 flex items-center gap-3 flex-wrap bg-white z-10 relative">
          <div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <button onClick={handlePrev} className="px-3 py-1.5 bg-white text-slate-500 hover:text-teal-600 font-bold text-[13px] border-r border-slate-200 transition-colors">‹</button>
            <button onClick={handleToday} className="px-3 py-1.5 bg-white text-slate-500 hover:text-teal-600 font-bold text-[13px] border-r border-slate-200 transition-colors">Hoy</button>
            <button onClick={handleNext} className="px-3 py-1.5 bg-white text-slate-500 hover:text-teal-600 font-bold text-[13px] transition-colors">›</button>
          </div>
          <span className="text-[15px] font-extrabold text-slate-800 mx-2 capitalize">
            {view === 'day' ? dayTitle : view === 'week' ? `Semana ${weekDays[0].date} - ${weekDays[6].date} de ${monthTitle}` : monthTitle}
          </span>
          
          <div className="ml-auto flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <button 
                onClick={() => setView('day')}
                className={`px-4 py-1.5 font-bold text-[13px] border-r border-slate-200 transition-colors ${view === 'day' ? 'bg-slate-100 text-slate-900 font-black' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                Día
              </button>
              <button 
                onClick={() => setView('week')}
                className={`px-4 py-1.5 font-bold text-[13px] border-r border-slate-200 transition-colors ${view === 'week' ? 'bg-slate-100 text-slate-900 font-black' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                Semana
              </button>
              <button 
                onClick={() => setView('month')}
                className={`px-4 py-1.5 font-bold text-[13px] transition-colors ${view === 'month' ? 'bg-slate-100 text-slate-900 font-black' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                Mes
              </button>
            </div>
            <button 
              onClick={() => navigate('/booking')} 
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-[13px] transition-colors shadow-sm"
            >
              + Nuevo turno
            </button>
          </div>
        </div>

        {/* LAYOUT BODY */}
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* SIDEBAR LEFT */}
          <div className="w-[180px] lg:w-[220px] border-r border-slate-200 p-4 shrink-0 overflow-y-auto bg-white">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-3">
              Hoy — {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })}
            </div>
            
            {appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length > 0 ? 
              appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).map((app, i) => (
                <div key={i} onClick={() => setSelectedAppt(app)} className={`border-l-4 ${app.status==='pending'?'border-orange-500 bg-orange-50':'border-teal-500 bg-teal-50'} p-2.5 rounded-r-lg mb-2.5 cursor-pointer hover:opacity-80 transition-opacity`}>
                  <div className={`text-[11px] font-black ${app.status==='pending'?'text-orange-500':'text-teal-600'}`}>
                    {new Date(app.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight my-0.5">{app.patient?.full_name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{app.notes || 'Consulta'}</div>
                </div>
              )) : <div className="text-[13px] font-bold text-slate-400 italic mb-5">Sin turnos hoy</div>
            }

            <div className="h-px w-full bg-slate-200 my-5"></div>
            
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-3">Próximos turnos</div>
            {appointments.filter(a => new Date(a.date) >= new Date()).slice(0, 5).map((app, i) => (
              <div key={i} onClick={() => setSelectedAppt(app)} className="mb-4 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  <span className="text-[11px] font-black text-slate-400 uppercase">
                    {new Date(app.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="text-[13px] font-bold text-slate-700 leading-tight">{app.patient?.full_name}</div>
              </div>
            ))}
          </div>

          {/* CALENDAR GRID / MONTH GRID */}
          <div className="flex-1 overflow-auto bg-white flex flex-col relative min-w-[500px]">
            {view === 'month' ? (
              <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-5 h-full">
                  {(() => {
                    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const firstDayIdx = (monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1);
                    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    
                    return Array.from({ length: 35 }).map((_, i) => {
                      const dayNum = i - firstDayIdx + 1;
                      const dateObj = (dayNum > 0 && dayNum <= daysInMonth) ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum) : null;
                      const hasAppts = appointments.filter(a => new Date(a.date).toDateString() === dateObj?.toDateString());
                      const isToday = dateObj?.toDateString() === new Date().toDateString();

                      return (
                        <div key={i} className={`border-r border-b border-slate-100 p-2 min-h-[120px] hover:bg-slate-50 transition-colors ${!dateObj ? 'bg-slate-50/30' : ''}`}>
                          {dateObj && (
                            <>
                              <div className={`text-sm font-black mb-2 ${isToday ? 'text-white bg-teal-600 w-7 h-7 rounded-full flex items-center justify-center -ml-1 shadow-md' : 'text-slate-400'}`}>
                                {dayNum}
                              </div>
                              <div className="space-y-1">
                                {hasAppts.slice(0, 3).map((app, j) => (
                                  <div 
                                    key={j} 
                                    onClick={() => setSelectedAppt(app)}
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded truncate border-l-2 cursor-pointer ${
                                      app.status === 'confirmed' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-orange-50 border-orange-500 text-orange-700'
                                    }`}
                                  >
                                    {new Date(app.date).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })} {app.patient?.full_name}
                                  </div>
                                ))}
                                {hasAppts.length > 3 && (
                                  <div className="text-[9px] font-black text-slate-400 pl-1">+{hasAppts.length - 3} más</div>
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
                    {hours.map(h => (
                      <div key={h} className="h-[60px] border-b border-slate-100 flex items-start justify-center pt-1.5 text-[10px] font-extrabold text-slate-400">
                        {h}
                      </div>
                    ))}
                  </div>
                  
                  {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 text-slate-600 font-bold backdrop-blur-sm">Cargando turnos...</div>}
                  
                  {weekDays.filter(d => view === 'week' || d.fullDate.toDateString() === currentDate.toDateString()).map((d, i) => (
                    <div key={i} className={`flex-1 border-r border-slate-200 relative overflow-hidden h-[600px] ${d.isToday ? 'bg-[#FAFFFE]' : 'bg-white'}`}>
                      {hours.map(h => <div key={h} className="h-[60px] border-b border-slate-100"></div>)}
                      
                      {calAppts[weekDays.indexOf(d)]?.map((app, j) => (
                        <div 
                          key={j} 
                          onClick={() => setSelectedAppt(app.orig)}
                          className={`absolute left-[3px] right-[3px] rounded-md px-2.5 py-1.5 cursor-pointer overflow-hidden transition-all duration-200 hover:brightness-95 hover:shadow-md ${app.cls}`}
                          style={{ top: `${app.top}px`, height: `${app.height}px`, zIndex: 10 + j }}
                        >
                          <div className={`text-[10px] font-black ${app.orig.status === 'pending' ? 'text-orange-600/80' : 'text-teal-800/60'}`}>{app.time}</div>
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

          {/* DETAIL PANEL (RIGHT) */}
          {selectedAppt && (
            <div className="w-[280px] border-l border-slate-200 bg-white shrink-0 p-5 flex flex-col shadow-[-10px_0_20px_rgba(0,0,0,0.03)] z-30 absolute right-0 top-0 bottom-0 h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-5 mt-1">
                <h4 className="font-extrabold text-[15px] text-slate-800">Detalle del turno</h4>
                <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-slate-800 transition-colors text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50">&times;</button>
              </div>
              
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-white font-black text-xl mb-3 shadow-md">
                {(selectedAppt.patient?.full_name || 'NN').substring(0,2).toUpperCase()}
              </div>
              <div className="text-lg font-black text-slate-900 leading-none mb-1.5">{selectedAppt.patient?.full_name || 'Paciente Anon'}</div>
              <div className="text-[12px] font-bold text-slate-500 mb-5">Turno de sistema #{selectedAppt.id}</div>
              
              <div className="h-px bg-slate-200 w-full mb-5"></div>
              
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-sm shrink-0 border border-teal-100">📅</div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Fecha y hora</div>
                  <div className="text-[13px] font-bold text-slate-800 mt-1">
                    {new Date(selectedAppt.date).toLocaleString('es-AR', { weekday:'long', day:'numeric', month:'long' })}
                    <div className="text-teal-600 font-black mt-0.5">{new Date(selectedAppt.date).toLocaleString('es-AR', { hour:'2-digit', minute:'2-digit' })} hs</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm shrink-0 border border-blue-100">🤸</div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Motivo / Notas</div>
                  <div className="text-[13px] font-bold text-slate-800 mt-1 leading-relaxed">{selectedAppt.notes || 'Consulta General por defecto'}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-sm shrink-0 border border-slate-200">📊</div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Estado actual</div>
                  <div className={`text-[13px] font-black mt-1 capitalize px-2.5 py-1 rounded-md inline-block ${
                    selectedAppt.status === 'confirmed' ? 'bg-green-50 text-green-700' : 
                    selectedAppt.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-700'
                  }`}>
                    {selectedAppt.status === 'confirmed' ? '✓ Confirmado' : selectedAppt.status === 'pending' ? '⏳ Pendiente' : '⨯ Cancelado'}
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-slate-200 w-full mb-5 mt-auto"></div>
              
              <button className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold rounded-xl mb-2.5 transition-colors shadow-sm">
                Registrar evolución
              </button>
              <button className="w-full py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-[13px] font-bold rounded-xl mb-2.5 transition-colors">
                Enviar indicaciones
              </button>
              {selectedAppt.status !== 'cancelled' && (
                <button className="w-full py-3 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 text-[13px] font-bold rounded-xl transition-colors">
                  Cancelar turno
                </button>
              )}
            </div>
          )}
          
        </div>
      </div>
    </AdminLayout>
  )
}