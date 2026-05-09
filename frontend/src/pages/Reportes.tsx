import { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { reportApi } from '../services/api';
import { useAuthStore } from '../context/auth';

export function Reportes() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  const years = [2024, 2025, 2026];

  const [kinesiologoId, setKinesiologoId] = useState<number | null>(null);

  useEffect(() => {
    // If admin, fetch kinesiologos to get the first one's ID
    if (user?.role === 'admin') {
      import('../services/api').then(({ userApi }) => {
        userApi.getKinesiologosProfiles().then((res) => {
          if (res.data && res.data.length > 0) {
            setKinesiologoId(res.data[0].id);
          }
        }).catch(err => console.error("Could not fetch kinesiologos", err));
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'kinesiologo' || (user?.role === 'admin' && kinesiologoId)) {
      fetchReport();
    }
  }, [selectedMonth, selectedYear, kinesiologoId, user]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { year: selectedYear, month: selectedMonth };
      // Si el usuario es administrador, usamos el ID seleccionado
      if (user?.role === 'admin' && kinesiologoId) {
         params.kinesiologo_id = kinesiologoId; 
      }

      const response = await reportApi.getMonthlyReport(params);
      setReportData(response.data);
    } catch (err: any) {
      setError(err.apiMessage || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  return (
    <AdminLayout pageTitle="Módulo de Reportes">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-3">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2.5 font-semibold"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2.5 font-semibold"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
          >
            <span className="text-lg">🖨️</span> Imprimir Reporte
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-medium flex items-center gap-3">
            <span>⚠️</span> {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3"></div>
            Cargando reporte...
          </div>
        ) : reportData ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">💰</div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ingresos Totales</h3>
                </div>
                <div className="text-3xl font-black text-slate-800">
                  ${reportData.total_revenue.toLocaleString('es-AR')}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">📅</div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Turnos Totales</h3>
                </div>
                <div className="text-3xl font-black text-slate-800">
                  {reportData.total_appointments}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">✅</div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tasa Asistencia</h3>
                </div>
                <div className="text-3xl font-black text-slate-800">
                  {Math.round(reportData.completion_rate)}%
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">👥</div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Completados</h3>
                </div>
                <div className="text-3xl font-black text-slate-800">
                  {reportData.completed_appointments}
                </div>
              </div>
            </div>

            {/* Gráfico y Desglose */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">Desempeño del Mes</h3>
                
                <div className="flex items-end gap-4 h-48 border-b border-slate-200 pb-2">
                  <div className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-slate-200 rounded-t-md transition-all relative"
                      style={{ height: `${reportData.total_appointments === 0 ? 0 : 100}%`, minHeight: '4px' }}
                    >
                      <div className="absolute -top-6 w-full text-center text-xs font-bold text-slate-500">{reportData.total_appointments}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-600">Total</div>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-teal-500 rounded-t-md transition-all relative"
                      style={{ height: `${reportData.total_appointments === 0 ? 0 : (reportData.completed_appointments / reportData.total_appointments) * 100}%`, minHeight: '4px' }}
                    >
                      <div className="absolute -top-6 w-full text-center text-xs font-bold text-teal-600">{reportData.completed_appointments}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-600">Compl.</div>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-orange-400 rounded-t-md transition-all relative"
                      style={{ height: `${reportData.total_appointments === 0 ? 0 : (reportData.pending_appointments / reportData.total_appointments) * 100}%`, minHeight: '4px' }}
                    >
                      <div className="absolute -top-6 w-full text-center text-xs font-bold text-orange-600">{reportData.pending_appointments}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-600">Pend.</div>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-red-400 rounded-t-md transition-all relative"
                      style={{ height: `${reportData.total_appointments === 0 ? 0 : (reportData.cancelled_appointments / reportData.total_appointments) * 100}%`, minHeight: '4px' }}
                    >
                      <div className="absolute -top-6 w-full text-center text-xs font-bold text-red-600">{reportData.cancelled_appointments}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-600">Canc.</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Resumen Profesional</h3>
                  <p className="text-sm text-slate-500 font-medium px-8 leading-relaxed">
                    Durante este período, el kinesiólogo <strong className="text-slate-800">{reportData.kinesiologo_name}</strong> ha 
                    tenido una tasa de asistencia del <strong className="text-teal-600">{Math.round(reportData.completion_rate)}%</strong> y 
                    ha generado un total estimado de <strong className="text-teal-600">${reportData.total_revenue.toLocaleString('es-AR')}</strong> en ingresos.
                  </p>
                </div>
              </div>
            </div>
            
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
