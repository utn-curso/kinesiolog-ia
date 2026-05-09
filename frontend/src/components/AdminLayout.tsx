import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/auth';
import { notificationsApi } from '../services/api';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
  type: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  topbarRight?: React.ReactNode;
}

export function AdminLayout({ children, pageTitle = 'Dashboard', topbarRight }: AdminLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [selectedNotif, setSelectedNotif] = React.useState<Notification | null>(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 1 minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 my-1 cursor-pointer text-[13px] font-bold transition-all duration-200 ${
      isActive
        ? 'bg-teal-600 text-white'
        : 'text-white/60 hover:bg-white/10 hover:text-white'
    }`;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* SIDEBAR */}
      <div className="w-[220px] bg-slate-900 flex flex-col shrink-0">
        <Link to="/" className="px-5 py-5 text-[17px] font-black text-white border-b border-white/10 hover:text-teal-200 transition-colors">
          Kine<span className="text-teal-50">Mov</span>
        </Link>
        
        <div className="px-5 pt-4 pb-2 text-[10px] font-extrabold text-white/30 tracking-widest uppercase">
          Principal
        </div>
        <NavLink to="/dashboard" className={navItemClass}>
          <span className="text-sm">📊</span> Dashboard
        </NavLink>
        <NavLink to="/agenda" className={navItemClass}>
          <span className="text-sm">📅</span> Turnos
        </NavLink>
        {user?.role === 'kinesiologo' && (
          <NavLink to="/disponibilidad" className={navItemClass}>
            <span className="text-sm">🕐</span> Mis horarios
          </NavLink>
        )}
        <NavLink to="/profile" className={navItemClass}>
          <span className="text-sm">👤</span> Perfil
        </NavLink>
        {(user?.role === 'kinesiologo' || user?.role === 'admin') && (
          <NavLink to="/pacientes" className={navItemClass}>
            <span className="text-sm">👥</span> Pacientes
          </NavLink>
        )}

        <div className="px-5 pt-4 pb-2 text-[10px] font-extrabold text-white/30 tracking-widest uppercase">
          Gestión
        </div>
        {user?.role === 'admin' && (
          <>
            <NavLink to="/kinesiologos" className={navItemClass}>
              <span className="text-sm">🩺</span> Kinesiólogos
            </NavLink>
            <NavLink to="/honorarios" className={navItemClass}>
              <span className="text-sm">💰</span> Honorarios
            </NavLink>
          </>
        )}
        <NavLink to="/ejercicios" className={navItemClass}>
          <span className="text-sm">🏋️</span> Catálogo Ejercicios
        </NavLink>
        {(user?.role === 'kinesiologo' || user?.role === 'admin') && (
          <NavLink to="/reportes" className={navItemClass}>
            <span className="text-sm">📋</span> Reportes
          </NavLink>
        )}

        <div className="mt-auto px-4 py-4 border-t border-white/10 flex items-center justify-between group">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-[11px] font-extrabold text-white shrink-0">
              {user ? getInitials(user.full_name) : 'User'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <div className="text-xs font-bold text-white truncate">
                {user?.full_name || 'Usuario'}
              </div>
              <div className="text-[10px] text-white/40 capitalize truncate">
                {user?.role || 'Guest'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-red-400 transition-colors p-1"
            title="Cerrar sesión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOPBAR */}
        <div className="h-[60px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <h2 className="text-base font-extrabold">{pageTitle}</h2>
          <div className="flex items-center gap-4">
            {topbarRight || (
              <>
                <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                  {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="relative">
                  <div 
                    className="relative cursor-pointer text-lg hover:scale-110 transition-transform"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-fade-in">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-[13px] font-black text-slate-800">Notificaciones</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[10px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-wider"
                          >
                            Marcar todo como leído
                          </button>
                        )}
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => {
                            let typeIcon = "🔔";
                            let typeColor = "bg-teal-500";
                            let typeTitle = "Notificación";
                            
                            if (n.type === 'cancellation') { typeIcon = "❌"; typeColor = "bg-red-500"; typeTitle = "Turno Cancelado"; }
                            if (n.type === 'reschedule') { typeIcon = "📅"; typeColor = "bg-orange-500"; typeTitle = "Turno Reprogramado"; }
                            if (n.type === 'reminder') { typeIcon = "⏰"; typeColor = "bg-blue-500"; typeTitle = "Recordatorio"; }
                            if (n.type === 'confirmation') { typeIcon = "✅"; typeColor = "bg-teal-600"; typeTitle = "Turno Confirmado"; }

                            return (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  if (!n.is_read) markAsRead(n.id);
                                  setSelectedNotif(n);
                                }}
                                className={`px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-all cursor-pointer relative group ${!n.is_read ? 'bg-teal-50/30' : 'bg-white'}`}
                              >
                                <div className="flex gap-3">
                                  <div className={`w-8 h-8 rounded-lg ${typeColor} text-white flex items-center justify-center text-sm shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                                    {typeIcon}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`text-[12px] font-black text-slate-800 leading-snug mb-0.5 ${!n.is_read ? 'pr-3' : ''}`}>
                                      {typeTitle}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium leading-tight line-clamp-1 mb-1">
                                      {n.message.split('\n').find((l: string) => l.trim() !== '' && !l.includes('Hola'))?.replace(/📅|⏰|👨‍⚕️/g, '') || 'Ver detalle'}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                      {new Date(n.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} hs
                                    </div>
                                  </div>
                                  {!n.is_read && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-teal-500 rounded-full shadow-sm shadow-teal-200"></div>}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-10 text-center flex flex-col items-center gap-2">
                            <span className="text-3xl opacity-20">📭</span>
                            <span className="text-xs font-bold text-slate-400">No tienes notificaciones</span>
                          </div>
                        )}
                      </div>
                      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KineMov v1.0</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CONTENT SCROLL AREA */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
          {children}
        </div>
      </div>

      {/* NOTIFICATION DETAIL MODAL */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${
              selectedNotif.type === 'cancellation' ? 'bg-red-50/50' : 
              selectedNotif.type === 'reschedule' ? 'bg-orange-50/50' : 
              selectedNotif.type === 'confirmation' ? 'bg-teal-50/50' : 'bg-blue-50/50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {selectedNotif.type === 'cancellation' ? '❌' : 
                   selectedNotif.type === 'reschedule' ? '📅' : 
                   selectedNotif.type === 'confirmation' ? '✅' : '🔔'}
                </span>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  {selectedNotif.type === 'cancellation' ? 'Turno Cancelado' : 
                   selectedNotif.type === 'reschedule' ? 'Turno Reprogramado' : 
                   selectedNotif.type === 'confirmation' ? 'Turno Confirmado' : 'Notificación'}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedNotif(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-8">
              <div className="text-[13px] text-slate-600 font-bold leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                {selectedNotif.message}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {new Date(selectedNotif.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                  ENTENDIDO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
