import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Ticket as TicketIcon, 
  Users as UsersIcon, 
  Settings as SettingsIcon, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
  };

  const menuItems = [
    {
      id: 'tickets',
      label: 'Tickets',
      icon: TicketIcon,
      path: '/',
      hasSub: true,
      subItems: [
        { id: 'sub-usuarios', label: 'Usuarios', path: '/usuarios', adminOnly: true }
      ]
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: UsersIcon,
      path: '/usuarios',
      adminOnly: true
    }
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex flex-col justify-between z-30 ${
        expanded ? 'w-56' : 'w-16'
      }`}
    >
      <div>
        {/* LOGO AREA */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100 h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-purple-200">
              <Activity size={20} fill="none" />
            </div>
            {expanded && (
              <span className="font-sans font-bold text-purple-900 text-lg tracking-tight">Task-flow</span>
            )}
          </div>
          {expanded ? (
            <button 
              onClick={() => setExpanded(false)} 
              className="text-gray-400 hover:text-[#5B21B6] p-1 hover:bg-[#F5F3FF] rounded-lg transition-colors hidden sm:block"
            >
              <ChevronLeft size={16} />
            </button>
          ) : (
            <button 
              onClick={() => setExpanded(true)} 
              className="text-gray-400 hover:text-[#5B21B6] p-1 hover:bg-[#F5F3FF] rounded-lg transition-colors mx-auto mt-1 hidden sm:block"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="mt-6 px-2 space-y-1">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;

            const isActive = location.pathname === item.path;

            return (
              <div key={item.id} className="space-y-1">
                {item.hasSub ? (
                  <div>
                    <button
                      onClick={() => {
                        if (expanded) {
                          setShowSubMenu(!showSubMenu);
                        } else {
                          setExpanded(true);
                          setShowSubMenu(true);
                        }
                      }}
                      className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm transition-all font-medium ${
                        isActive
                          ? 'bg-[#F5F3FF] text-[#5B21B6] border-l-4 border-[#5B21B6]'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={isActive ? 'text-[#5B21B6]' : 'text-gray-400'} />
                        {expanded && <span>{item.label}</span>}
                      </div>
                      {expanded && <ChevronDown size={14} className={`transition-transform duration-200 ${showSubMenu ? 'rotate-180' : ''}`} />}
                    </button>

                    {expanded && showSubMenu && (
                      <div className="pl-9 pr-2 py-1 space-y-1">
                        {item.subItems.map(sub => {
                          if (sub.adminOnly && !isAdmin) return null;
                          const isSubActive = location.pathname === sub.path;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => handleNav(sub.path)}
                              className={`w-full text-left py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                                isSubActive
                                  ? 'bg-[#F5F3FF] text-[#5B21B6] font-semibold'
                                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm transition-all font-medium ${
                      isActive
                        ? 'bg-[#F5F3FF] text-[#5B21B6] border-l-4 border-[#5B21B6]'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-[#5B21B6]' : 'text-gray-400'} />
                    {expanded && <span>{item.label}</span>}
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* FOOTER SECTION (Avatar & settings) */}
      <div className="border-t border-gray-50 p-2 space-y-1">
        <button
          onClick={() => alert('Configuración general (Solo vista)')}
          className="flex items-center gap-3 w-full py-2 px-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors font-medium"
        >
          <SettingsIcon size={18} className="text-gray-400" />
          {expanded && <span>Configuración</span>}
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full py-2 px-3 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors font-medium"
        >
          <LogOut size={18} className="text-red-400" />
          {expanded && <span>Cerrar Sesión</span>}
        </button>

        {user && (
          <div className="flex items-center justify-between p-2 mt-2 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs uppercase shadow-sm">
                {user.nombre.charAt(0)}
              </div>
              {expanded && (
                <div className="text-left w-24">
                  <p className="text-xs font-bold text-gray-700 truncate leading-tight">{user.nombre}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{user.rol === 'administrador' ? 'Admin' : 'Miembro'}</p>
                </div>
              )}
            </div>
            {expanded && (
              <ChevronDown size={14} className="text-gray-400 mr-1" />
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
