import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import Sidebar from '../components/Sidebar.tsx';
import {
  User,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, token, login } = useAuth();

  // ── Perfil ──────────────────────────────────
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Contraseña ──────────────────────────────
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) setNombre(user.nombre);
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setProfileStatus({ type: 'error', msg: 'El nombre no puede estar vacío' });
      return;
    }
    if (nombre.trim() === user?.nombre) {
      setProfileStatus({ type: 'error', msg: 'No hay cambios en el nombre' });
      return;
    }
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: nombre.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        // Update context so the sidebar name refreshes
        login(token!, { ...user!, nombre: data.nombre });
        setProfileStatus({ type: 'success', msg: 'Nombre actualizado correctamente' });
      } else {
        setProfileStatus({ type: 'error', msg: data.error || 'Error al guardar' });
      }
    } catch {
      setProfileStatus({ type: 'error', msg: 'Error de conexión con el servidor' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordActual || !passwordNuevo || !passwordConfirm) {
      setPasswordStatus({ type: 'error', msg: 'Todos los campos de contraseña son obligatorios' });
      return;
    }
    if (passwordNuevo !== passwordConfirm) {
      setPasswordStatus({ type: 'error', msg: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    if (passwordNuevo.length < 6) {
      setPasswordStatus({ type: 'error', msg: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }
    setSavingPassword(true);
    setPasswordStatus(null);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ passwordActual, passwordNuevo })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ type: 'success', msg: 'Contraseña cambiada correctamente' });
        setPasswordActual('');
        setPasswordNuevo('');
        setPasswordConfirm('');
      } else {
        setPasswordStatus({ type: 'error', msg: data.error || 'Error al cambiar contraseña' });
      }
    } catch {
      setPasswordStatus({ type: 'error', msg: 'Error de conexión con el servidor' });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user?.nombre?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex min-h-screen bg-[#F8F7FF]">
      <Sidebar />
      <main className="flex-1 ml-56 p-8 max-w-3xl">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Configuración</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona tu perfil y seguridad de cuenta</p>
        </div>

        {/* Avatar Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-2xl shadow-inner">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">{user?.nombre}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${user?.rol === 'administrador' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {user?.rol === 'administrador' ? 'Administrador' : 'Miembro de Soporte'}
            </span>
          </div>
        </div>

        {/* ── Sección: Información Personal ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <User size={16} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Información Personal</h2>
              <p className="text-xs text-gray-400">Actualiza tu nombre de visualización</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all bg-gray-50/50"
                  placeholder="Tu nombre completo"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Correo Electrónico</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-100 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                  title="El correo no se puede cambiar"
                />
              </div>
            </div>

            {profileStatus && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${profileStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {profileStatus.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {profileStatus.msg}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-purple-200"
              >
                <Save size={15} />
                {savingProfile ? 'Guardando...' : 'Guardar Nombre'}
              </button>
            </div>
          </form>
        </section>

        {/* ── Sección: Seguridad / Contraseña ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Lock size={16} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Seguridad</h2>
              <p className="text-xs text-gray-400">Cambia tu contraseña de acceso</p>
            </div>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            {/* Contraseña actual */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contraseña Actual</label>
              <div className="relative">
                <input
                  type={showActual ? 'text' : 'password'}
                  value={passwordActual}
                  onChange={e => setPasswordActual(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowActual(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showActual ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nueva contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showNuevo ? 'text' : 'password'}
                    value={passwordNuevo}
                    onChange={e => setPasswordNuevo(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowNuevo(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNuevo ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirmar Contraseña</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm text-gray-800 outline-none transition-all bg-gray-50/50 ${passwordNuevo && passwordConfirm && passwordNuevo !== passwordConfirm ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'}`}
                  placeholder="Repite la nueva contraseña"
                />
              </div>
            </div>

            {/* Barra de fortaleza */}
            {passwordNuevo && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${
                      passwordNuevo.length >= n * 3
                        ? passwordNuevo.length >= 10 ? 'bg-green-400' : passwordNuevo.length >= 7 ? 'bg-yellow-400' : 'bg-red-400'
                        : 'bg-gray-100'
                    }`} />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400">
                  {passwordNuevo.length < 6 ? 'Demasiado corta' : passwordNuevo.length < 8 ? 'Débil' : passwordNuevo.length < 10 ? 'Moderada' : 'Fuerte'}
                </p>
              </div>
            )}

            {passwordStatus && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${passwordStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {passwordStatus.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {passwordStatus.msg}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-orange-200"
              >
                <Lock size={15} />
                {savingPassword ? 'Guardando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        </section>

        {/* ── Sección: Información del Sistema ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Información del Sistema</h2>
              <p className="text-xs text-gray-400">Detalles de tu cuenta y acceso</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'ID de usuario', value: `#${user?.id}` },
              { label: 'Rol asignado', value: user?.rol === 'administrador' ? 'Administrador' : 'Miembro de Soporte' },
              { label: 'Correo electrónico', value: user?.email || '—' },
              { label: 'Estado de cuenta', value: 'Activa' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50/70 border border-gray-100 rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-700">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
