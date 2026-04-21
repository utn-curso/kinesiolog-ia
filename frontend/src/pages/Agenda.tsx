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
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await appointmentApi.getAppointments()
        setAppointments(data)
      } catch (error) {
        console.error('Error fetching agenda appointments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [])

  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  const days = [
    { name: 'Lun', date: 23 },
    { name: 'Mar', date: 24 },
    { name: 'Mié', date: 25, isToday: true },
    { name: 'Jue', date: 26 },
    { name: 'Vie', date: 27 },
  ];

  const calAppts: Record<number, any[]> = { 0:[], 1:[], 2:[], 3:[], 4:[] };
  
  appointments.forEach(app => {
    const d = new Date(app.date);
    const jsDay = d.getDay(); 
    let col = jsDay - 1; 
    
    // For demo purposes: shift test dates roughly to fit current week visually
    if (col < 0 || col > 4) col = 2; // Default to 'Mié' if out of bounds (weekend)

    const h = d.getHours();
    const m = d.getMinutes();
    const top = (h - 8) * 60 + m + 4;
    const height = (app.duration_minutes || 60) - 8; 
    
    let cls = 'border-l-[3px] border-teal-500 bg-teal-50';
    if(app.status === 'pending') cls = 'border-l-[3px] border-orange-500 bg-orange-50';
    if(app.status === 'cancelled') cls = 'border-l-[3px] border-red-500 bg-red-50';

    calAppts[col].push({
      orig: app,
      top,
      height,
      cls,
      time: `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`,
      name: app.patient?.full_name || 'Paciente',
      treatment: app.notes || 'Consulta'
    })
  });

  const activeApptsCount = appointments.filter(a => a.status !== 'cancelled').length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;

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
            <button className="px-3 py-1.5 bg-white text-slate-500 hover:text-teal-600 font-bold text-[13px] border-r border-slate-200 transition-colors">‹</button>
            <button className="px-3 py-1.5 bg-teal-600 text-white font-bold text-[13px] border-r border-slate-200">Hoy</button>
            <button className="px-3 py-1.5 bg-white text-slate-500 hover:text-teal-600 font-bold text-[13px] transition-colors">›</button>
          </div>
          <span className="text-[15px] font-extrabold text-slate-800 mx-2">23 – 27 de Marzo, 2026</span>
          
          <div className="ml-auto flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <button className="px-3 py-1.5 bg-white text-slate-500 font-bold text-[13px] border-r border-slate-200 hover:bg-slate-50 transition-colors">Día</button>
              <button className="px-3 py-1.5 bg-slate-100 text-slate-900 font-black text-[13px] border-r border-slate-200 cursor-default">Semana</button>
              <button className="px-3 py-1.5 bg-white text-slate-500 font-bold text-[13px] hover:bg-slate-50 transition-colors">Mes</button>
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
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-3">Hoy — Mié 25/03</div>
            
            {calAppts[2]?.length > 0 ? calAppts[2].map((app, i) => (
              <div key={i} onClick={() => setSelectedAppt(app.orig)} className={`border-l-4 ${app.orig.status==='pending'?'border-orange-500 bg-orange-50':'border-teal-500 bg-teal-50'} p-2.5 rounded-r-lg mb-2.5 cursor-pointer hover:opacity-80 transition-opacity`}>
                <div className={`text-[11px] font-black ${app.orig.status==='pending'?'text-orange-500':'text-teal-600'}`}>{app.time}</div>
                <div className="text-[13px] font-bold text-slate-800 leading-tight my-0.5">{app.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{app.treatment}</div>
              </div>
            )) : <div className="text-[13px] font-bold text-slate-400 italic mb-5">Sin turnos hoy</div>}

            <div className="h-px w-full bg-slate-200 my-5"></div>
            
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-3">Esta semana</div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-2.5">
              <div className="text-2xl font-black text-teal-600 leading-none">{activeApptsCount}</div>
              <div className="text-[11px] font-bold text-slate-500 mt-1">Turnos activos</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-2.5">
              <div className="text-2xl font-black text-orange-500 leading-none">{pendingCount}</div>
              <div className="text-[11px] font-bold text-slate-500 mt-1">Pendientes de confirm.</div>
            </div>
          </div>

          {/* CALENDAR GRID */}
          <div className="flex-1 overflow-auto bg-white flex flex-col relative min-w-[500px]">
            {/* Header */}
            <div className="sticky top-0 z-20 flex bg-white border-b border-slate-200 shadow-sm">
              <div className="w-[50px] border-r border-slate-200 shrink-0 bg-white"></div>
              {days.map((d, i) => (
                <div key={i} className={`flex-1 text-center py-2.5 border-r border-slate-200 bg-white last:border-0 ${d.isToday ? 'border-b-[3px] border-b-teal-500 relative' : ''}`}>
                  <div className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider hidden sm:block">{d.name}</div>
                  <div className={`text-xl font-black leading-tight mt-0.5 ${d.isToday ? 'text-teal-600' : 'text-slate-800'}`}>{d.date}</div>
                </div>
              ))}
            </div>
            
            {/* Body */}
            <div className="flex flex-1 relative">
              {/* Timeline labels */}
              <div className="w-[50px] bg-white border-r border-slate-200 shrink-0 flex flex-col z-10">
                {hours.map(h => (
                  <div key={h} className="h-[60px] border-b border-slate-100 flex items-start justify-center pt-1.5 text-[10px] font-extrabold text-slate-400">
                    {h}
                  </div>
                ))}
              </div>
              
              {/* Day columns */}
              {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 text-slate-600 font-bold backdrop-blur-sm">Cargando turnos...</div>}
              {days.map((d, i) => (
                <div key={i} className={`flex-1 border-r border-slate-200 relative overflow-hidden h-[600px] ${d.isToday ? 'bg-[#FAFFFE]' : 'bg-white'}`}>
                  {/* Grid lines */}
                  {hours.map(h => (
                    <div key={h} className="h-[60px] border-b border-slate-100"></div>
                  ))}
                  
                  {/* Appointments */}
                  {calAppts[i]?.map((app, j) => (
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

                  {/* Now Line */}
                  {d.isToday && (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: '230px' }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-500 absolute -left-[5px] -top-1 shadow-sm"></div>
                      <div className="absolute left-1 right-0 top-0 h-0.5 bg-teal-500 shadow-sm opacity-80"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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