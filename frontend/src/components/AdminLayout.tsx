import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  topbarRight?: React.ReactNode;
}

export function AdminLayout({ children, pageTitle = 'Dashboard', topbarRight }: AdminLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
        <div className="px-5 py-5 text-[17px] font-black text-white border-b border-white/10">
          Kine<span className="text-teal-50">Mov</span>
        </div>
        
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
        <NavLink to="/reportes" className={navItemClass}>
          <span className="text-sm">📋</span> Reportes
        </NavLink>

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
                <div className="relative cursor-pointer text-lg">
                  🔔
                  <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
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
    </div>
  );
}
