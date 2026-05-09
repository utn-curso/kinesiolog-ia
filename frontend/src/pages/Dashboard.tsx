import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../components/AdminLayout'
import { appointmentApi, reportApi } from '../services/api'
import { useAuthStore } from '../context/auth'
import { AddExerciseModal } from '../components/AddExerciseModal'

interface Appointment {
  id: number;
  date: string;
  duration_minutes: number;
  status: string;
  notes?: string;
  patient?: { full_name: string };
  kinesiologo?: { user?: { full_name: string } };
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('month')
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [selectedNotesAppt, setSelectedNotesAppt] = useState<Appointment | null>(null)
  const [dashboardSummary, setDashboardSummary] = useState<any>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [showAllActivity, setShowAllActivity] = useState(false)
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [filterDesde, setFilterDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateString(d);
  })
  const [filterHasta, setFilterHasta] = useState(() => {
    return getLocalDateString(new Date());
  })
  const [appliedDesde, setAppliedDesde] = useState(filterDesde);
  const [appliedHasta, setAppliedHasta] = useState(filterHasta);
  
  const user = useAuthStore(state => state.user)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await appointmentApi.getAppointments()
        setAppointments(data)
        setError('')
      } catch (error: any) {
        setError(error.apiMessage || error.message || 'Error al cargar el dashboard.')
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [])

  useEffect(() => {
    if (user && user.role !== 'patient') {
      const fetchSummary = async () => {
        setSummaryLoading(true)
        try {
          const { data } = await reportApi.getDashboardSummary()
          setDashboardSummary(data)
        } catch (err) {
          console.error("Error fetching summary:", err)
        } finally {
          setSummaryLoading(false)
        }
      }
      fetchSummary()
    }
  }, [user])

  // Patient Dashboard View
  if (user?.role === 'patient') {
    return (
      <AdminLayout pageTitle="Mis Turnos">
        {error && (
          <div className="max-w-[1200px] mx-auto mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold">Error al cargar turnos</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5 max-w-[1200px] mx-auto">
          {/* Welcome & Action Row */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-800">Hola, {user.full_name} 👋</h2>
              <p className="text-sm text-slate-500 mt-1">Aquí puedes ver tus próximos turnos y tu historial de atención.</p>
            </div>
            <Link 
              to="/booking"
              className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-teal-700 transition-colors shrink-0"
            >
              Reservar Nuevo Turno
            </Link>
          </div>

          {/* Appointments List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-[15px] font-extrabold text-slate-800">Mis Turnos Registrados</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Desde</span>
                  <input 
                    type="date" 
                    value={filterDesde} 
                    onChange={e => setFilterDesde(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hasta</span>
                  <input 
                    type="date" 
                    value={filterHasta} 
                    onChange={e => setFilterHasta(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2"
                  />
                </div>
                <button 
                  onClick={() => {
                    if (!filterDesde || !filterHasta) {
                      alert("Por favor, complete ambas fechas (Desde y Hasta).");
                      return;
                    }
                    setAppliedDesde(filterDesde);
                    setAppliedHasta(filterHasta);
                  }}
                  className="mt-4 text-xs font-bold bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                >
                  Buscar
                </button>
                <button 
                  onClick={() => { 
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    const initDesde = getLocalDateString(d);
                    const initHasta = getLocalDateString(new Date());
                    setFilterDesde(initDesde); 
                    setFilterHasta(initHasta); 
                    setAppliedDesde(initDesde);
                    setAppliedHasta(initHasta);
                  }}
                  className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                >
                  Restaurar
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-5 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wide border-b border-slate-200">Fecha y Hora</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wide border-b border-slate-200">Kinesiólogo</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wide border-b border-slate-200">Estado</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wide border-b border-slate-200">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="text-center py-8 text-sm text-slate-500 font-medium">Cargando tus turnos...</td></tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12">
                        <div className="text-4xl mb-3">📅</div>
                        <p className="text-sm text-slate-600 font-medium mb-1">No tienes turnos programados</p>
                        <p className="text-xs text-slate-400">Puedes reservar tu próximo turno haciendo clic arriba.</p>
                      </td>
                    </tr>
                  ) : (
                    appointments.filter(app => {
                      if (appliedDesde && new Date(app.date) < new Date(appliedDesde + 'T00:00:00')) return false;
                      if (appliedHasta && new Date(app.date) > new Date(appliedHasta + 'T23:59:59')) return false;
                      return true;
                    }).map(app => {
                      const appointmentDate = new Date(app.date)
                      const isPastPending = app.status === 'pending' && appointmentDate < new Date()
                      const statusLabel = isPastPending ? 'Perdido' : app.status === 'completed' ? 'Completado' : app.status === 'confirmed' ? 'Confirmado' : app.status === 'pending' ? 'Pendiente' : 'Cancelado'
                      const statusClass = isPastPending
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : app.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : app.status === 'confirmed'
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : app.status === 'pending'
                              ? 'bg-orange-50 text-orange-600 border border-orange-100'
                              : 'bg-red-50 text-red-600 border border-red-100'

                      return (
                        <tr key={app.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="text-[13px] font-bold text-slate-800">
                              {appointmentDate.toLocaleDateString('es-AR', {weekday: 'long', day: '2-digit', month: 'long'})}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {appointmentDate.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})} hs
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-[13px] font-medium text-slate-600">
                            {app.kinesiologo?.user?.full_name || 'Kinesiólogo asignado'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td 
                            className={`px-5 py-3.5 text-[12px] max-w-[200px] truncate ${app.notes ? 'cursor-pointer text-slate-500 hover:text-teal-600 transition-colors' : 'text-slate-400'}`}
                            onClick={() => app.notes && setSelectedNotesAppt(app)}
                            title={app.notes ? "Click para ver notas completas" : ""}
                          >
                            {app.notes || '-'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal de Notas */}
        {selectedNotesAppt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setSelectedNotesAppt(null) }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 relative">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-lg">📝</div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Notas del Turno</h3>
                    <p className="text-xs font-bold text-slate-500">
                      {new Date(selectedNotesAppt.date).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNotesAppt(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors"
                >
                  &times;
                </button>
              </div>
              <div className="p-6 min-h-[200px] max-h-[60vh] overflow-y-auto">
                <div className="text-[14px] text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedNotesAppt.notes}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedNotesAppt(null)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    )
  }

  // Admin / Kinesiologo Dashboard View
  const monthData = dashboardSummary?.revenue_trend?.map((d: any) => d.revenue) || [590, 480, 667, 720, 650];
  const monthLabels = dashboardSummary?.revenue_trend?.map((d: any) => d.label) || ['Ene', 'Feb', 'Mar', 'Abr', 'May'];
  
  const weekData = [85, 92, 78, 110, 95, 102, 120];
  const weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const chartData = timeRange === 'month' ? monthData : weekData;
  const chartLabels = timeRange === 'month' ? monthLabels : weekLabels;
  const maxVal = Math.max(...chartData, 1000) * 1.15;

  // Real data logic: Filter appointments by date
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(now.getMonth() - 1);

  const appointmentsInMonth = appointments.filter(a => new Date(a.date) >= oneMonthAgo).length;
  const appointmentsInWeek = appointments.filter(a => new Date(a.date) >= oneWeekAgo).length;

  const totalMonth = appointments.length > 0 ? appointmentsInMonth : 148;
  const totalWeek = appointments.length > 0 ? appointmentsInWeek : 37;

  return (
    <AdminLayout pageTitle="Dashboard">
      {error && (
        <div className="max-w-[1200px] mx-auto mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-semibold">Error al cargar dashboard</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-5 max-w-[1200px] mx-auto">
        {/* RANGE TOGGLE */}
        <div className="flex justify-end mb-1">
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex gap-1 shadow-sm">
            <button 
              onClick={() => setTimeRange('week')}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                timeRange === 'week' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              SEMANA
            </button>
            <button 
              onClick={() => setTimeRange('month')}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                timeRange === 'month' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              MES
            </button>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-teal-50">📅</div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-green-50 text-green-600">↑ 8%</span>
            </div>
            <div className="text-3xl font-black leading-none text-slate-800">
              {dashboardSummary?.stats?.total_appointments || (timeRange === 'month' ? totalMonth : totalWeek)}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-1">Turnos {timeRange === 'month' ? 'del mes' : 'esta semana'}</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-blue-50">👥</div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-green-50 text-green-600">↑ 5%</span>
            </div>
            <div className="text-3xl font-black leading-none text-slate-800">{timeRange === 'month' ? '34' : '8'}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">Pacientes nuevos</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-green-50">✅</div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-600">↓ 2%</span>
            </div>
            <div className="text-3xl font-black leading-none text-slate-800">
              {dashboardSummary?.stats?.completion_rate ? `${Math.round(dashboardSummary.stats.completion_rate)}%` : '91%'}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-1">Tasa asistencia</div>
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-extrabold text-slate-800">Ingresos {timeRange === 'month' ? 'mensuales' : 'semanales'}</h3>
              <Link to="/reportes" className="text-xs text-teal-600 font-bold cursor-pointer hover:underline">Ver reporte completo →</Link>
            </div>
            <div className="flex items-end gap-2 h-[120px] pb-6 relative border-b border-slate-200">
              {chartData.map((val: number, idx: number) => {
                const isLast = idx === chartData.length - 1;
                const heightPct = Math.round((val / maxVal) * 100);
                const displayVal = val >= 1000 ? `${(val/1000).toFixed(1)}K` : `$${val}`;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div 
                      className={`w-full rounded-t-md relative transition-all duration-300 group-hover:brightness-95`}
                      style={{ height: `${heightPct}%`, minHeight: '4px', backgroundColor: isLast ? '#0D9488' : '#cbd5e1' }}
                    >
                      <div className={`absolute -top-3.5 w-full text-center text-[9px] font-extrabold ${isLast ? 'text-teal-600' : 'text-slate-400'}`}>
                        {displayVal}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold mt-1">{chartLabels[idx]}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-extrabold text-slate-800">Turnos Registrados</h3>
              <span className="bg-teal-50 text-teal-600 px-2 py-1 rounded-full text-[11px] font-bold">
                {appointments.length} total
              </span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide pb-2 border-b border-slate-200">Paciente</th>
                    <th className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide pb-2 border-b border-slate-200">Fecha</th>
                    <th className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide pb-2 border-b border-slate-200">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="text-center py-4 text-sm text-slate-500">Cargando...</td></tr>
                  ) : appointments.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-6 text-sm text-slate-500">No hay turnos registrados</td></tr>
                  ) : (
                    appointments.slice(0, 5).map(app => (
                      <tr key={app.id} className="hover:bg-slate-50 group border-b border-slate-50 last:border-0">
                        <td className="py-2.5 text-[13px] font-bold text-slate-800">
                          {app.patient?.full_name || 'Paciente ' + app.id}
                        </td>
                        <td className="py-2.5 text-[13px] text-slate-600">
                          {new Date(app.date).toLocaleDateString('es-AR', {day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit'})}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                            app.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                            app.status === 'pending' ? 'bg-orange-50 text-orange-500' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {app.status === 'confirmed' ? 'Confirmado' : app.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-[15px] font-extrabold text-slate-800 mb-4">Acciones rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowExerciseModal(true)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center transition-all hover:bg-teal-50 hover:border-teal-500 group"
              >
                <div className="text-xl mb-1">🏋️</div>
                <div className="text-xs font-extrabold text-slate-700 group-hover:text-teal-700">Agregar ejercicio</div>
              </button>
              <Link to="/reportes" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center transition-all hover:bg-teal-50 hover:border-teal-500 group block">
                <div className="text-xl mb-1">📋</div>
                <div className="text-xs font-extrabold text-slate-700 group-hover:text-teal-700">Generar reporte</div>
              </Link>
              <button className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center transition-all hover:bg-teal-50 hover:border-teal-500 group">
                <div className="text-xl mb-1">🔐</div>
                <div className="text-xs font-extrabold text-slate-700 group-hover:text-teal-700">Ver log auditoría</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-extrabold text-slate-800">Actividad reciente</h3>
              <span 
                onClick={() => setShowAllActivity(true)}
                className="text-xs text-teal-600 font-bold cursor-pointer hover:underline"
              >
                Ver todo
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {summaryLoading ? (
                <div className="py-10 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">Cargando actividad...</div>
              ) : dashboardSummary?.recent_activity?.length > 0 ? (
                dashboardSummary.recent_activity.map((n: any) => {
                  let colorClass = "bg-teal-500";
                  if (n.type === 'cancellation') colorClass = "bg-red-500";
                  if (n.type === 'reminder') colorClass = "bg-blue-500";
                  if (n.type === 'reschedule') colorClass = "bg-orange-500";

                  const timeAgo = new Date(n.created_at).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';
                  
                  // Extract actual meaningful content
                  let displayMessage = n.subject || n.message.split('\n')[2] || n.message.split('\n')[0];
                  if (displayMessage.includes('Hola')) {
                    displayMessage = n.message.split('\n').find((l: string) => l.trim() !== '' && !l.includes('Hola')) || displayMessage;
                  }

                  return (
                    <div key={n.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colorClass}`}></div>
                      <div>
                        <div className="text-[13px] font-medium text-slate-800 leading-tight">
                          {displayMessage}
                        </div>
                        <div className="text-[11px] text-slate-500">{timeAgo}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic">No hay actividad reciente</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {showExerciseModal && (
        <AddExerciseModal 
          onClose={() => setShowExerciseModal(false)}
          onSuccess={() => {
            // Optional: you could refresh dashboard data here if exercises were shown
            console.log('Exercise added successfully from dashboard');
          }}
        />
      )}
      {showAllActivity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setShowAllActivity(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 relative">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-lg">🔔</div>
                <h3 className="text-lg font-black text-slate-800">Toda la Actividad</h3>
              </div>
              <button 
                onClick={() => setShowAllActivity(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col gap-6">
                {dashboardSummary?.recent_activity?.map((n: any) => (
                  <div key={n.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 border-2 border-white shadow-sm shrink-0 ${
                        n.type === 'cancellation' ? 'bg-red-500' : 
                        n.type === 'reschedule' ? 'bg-orange-500' : 'bg-teal-500'
                      }`}></div>
                      <div className="w-0.5 h-full bg-slate-100 group-last:bg-transparent"></div>
                    </div>
                    <div>
                      <div className="text-[13px] font-extrabold text-slate-800 leading-tight mb-1">
                        {n.subject || 'Notificación del sistema'}
                      </div>
                      <div className="text-[12px] text-slate-500 font-medium whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                        {n.message.replace(/Hola.*?,/g, '').trim()}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-2">
                        {new Date(n.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} hs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowAllActivity(false)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
