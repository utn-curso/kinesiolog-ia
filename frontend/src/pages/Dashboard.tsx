import { useEffect, useState } from 'react'
import { AdminLayout } from '../components/AdminLayout'
import { appointmentApi } from '../services/api'

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
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('month')

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await appointmentApi.getAppointments()
        setAppointments(data)
      } catch (error) {
        console.error('Error fetching dashboard appointments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [])

  const monthData = [420, 510, 380, 620, 590, 480, 667];
  const monthLabels = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
  
  const weekData = [85, 92, 78, 110, 95, 102, 120];
  const weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const chartData = timeRange === 'month' ? monthData : weekData;
  const chartLabels = timeRange === 'month' ? monthLabels : weekLabels;
  const maxVal = Math.max(...chartData) * 1.15;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-teal-50">📅</div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-green-50 text-green-600">↑ 8%</span>
            </div>
            <div className="text-3xl font-black leading-none text-slate-800">
              {timeRange === 'month' ? totalMonth : totalWeek}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-1">Turnos {timeRange === 'month' ? 'del mes' : 'esta semana'}</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-orange-50">💰</div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-green-50 text-green-600">↑ 12%</span>
            </div>
            <div className="text-3xl font-black leading-none text-slate-800">{timeRange === 'month' ? '$667K' : '$120K'}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">Ingresos {timeRange === 'month' ? 'mensuales' : 'semanales'}</div>
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
            <div className="text-3xl font-black leading-none text-slate-800">91%</div>
            <div className="text-xs text-slate-500 font-bold mt-1">Tasa asistencia</div>
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-extrabold text-slate-800">Ingresos {timeRange === 'month' ? 'mensuales' : 'semanales'}</h3>
              <span className="text-xs text-teal-600 font-bold cursor-pointer">Ver reporte completo →</span>
            </div>
            <div className="flex items-end gap-2 h-[120px] pb-6 relative border-b border-slate-200">
              {chartData.map((val, idx) => {
                const isLast = idx === chartData.length - 1;
                const heightPct = Math.round((val / maxVal) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div 
                      className={`w-full rounded-t-md relative transition-all duration-300 group-hover:brightness-95`}
                      style={{ height: `${heightPct}%`, minHeight: '4px', backgroundColor: isLast ? '#0D9488' : '#cbd5e1' }}
                    >
                      <div className={`absolute -top-3.5 w-full text-center text-[9px] font-extrabold ${isLast ? 'text-teal-600' : 'text-slate-400'}`}>
                        ${val}K
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
              <button className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center transition-all hover:bg-teal-50 hover:border-teal-500 group">
                <div className="text-xl mb-1">🩺</div>
                <div className="text-xs font-extrabold text-slate-700 group-hover:text-teal-700">Nuevo kinesiólogo</div>
              </button>
              <button className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center transition-all hover:bg-teal-50 hover:border-teal-500 group">
                <div className="text-xl mb-1">🏋️</div>
                <div className="text-xs font-extrabold text-slate-700 group-hover:text-teal-700">Agregar ejercicio</div>
              </button>
              <button className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center transition-all hover:bg-teal-50 hover:border-teal-500 group">
                <div className="text-xl mb-1">📋</div>
                <div className="text-xs font-extrabold text-slate-700 group-hover:text-teal-700">Generar reporte</div>
              </button>
              <button className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center transition-all hover:bg-teal-50 hover:border-teal-500 group">
                <div className="text-xl mb-1">🔐</div>
                <div className="text-xs font-extrabold text-slate-700 group-hover:text-teal-700">Ver log auditoría</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-extrabold text-slate-800">Actividad reciente</h3>
              <span className="text-xs text-slate-500 font-bold cursor-pointer hover:text-slate-800">Ver todo</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-[13px] font-medium text-slate-800"><span className="font-extrabold">Laura Gómez</span> confirmó turno vía WhatsApp</div>
                  <div className="text-[11px] text-slate-500">Hace 12 min</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-[13px] font-medium text-slate-800"><span className="font-extrabold">Jorge Ríos</span> canceló turno de 14:00</div>
                  <div className="text-[11px] text-slate-500">Hace 40 min</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-[13px] font-medium text-slate-800"><span className="font-extrabold">Lic. María Acosta</span> envió indicaciones a Carlos P.</div>
                  <div className="text-[11px] text-slate-500">Hace 1h</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-[13px] font-medium text-slate-800">Pago de <span className="font-extrabold">$4.500</span> recibido — Mercado Pago</div>
                  <div className="text-[11px] text-slate-500">Hace 2h</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}