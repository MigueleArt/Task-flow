import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Usuario, Rol } from '../types.ts';
import { Plus, Users, User, ArrowLeft, Mail, ShieldAlert, Key, ToggleLeft, ToggleRight, AlertCircle, Trash } from 'lucide-react';

export default function UsersPage() {
  const { token, user } = useAuth();
  
  const [users, setUsers] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState('2'); // default "miembro" which usually is ID 2
  const [submitting, setSubmitting] = useState(false);

  const fetchUsersAndRoles = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch users
      const usersRes = await fetch('/api/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersRes.ok) {
        setUsers(usersData);
      } else {
        throw new Error(usersData.error || 'No se puede descargar usuarios');
      }

      // Fetch possible roles
      const rolesRes = await fetch('/api/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rolesData = await rolesRes.json();
      if (rolesRes.ok) {
        setRoles(rolesData);
        // auto select member role if present
        const memberRol = rolesData.find((r: Rol) => r.nombre === 'miembro');
        if (memberRol) setRolId(String(memberRol.id));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, [token]);

  // Submit adding user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!nombre || !email || !password || !rolId) {
      alert('Por favor complete todos los datos.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre,
          email,
          password,
          rolId: parseInt(rolId, 10),
          activo: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Reset and refresh
        setNombre('');
        setEmail('');
        setPassword('');
        setShowAddForm(false);
        fetchUsersAndRoles();
      } else {
        alert(data.error || 'Error al guardar el usuario');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (targetUser: Usuario) => {
    if (!token) return;
    if (targetUser.id === user?.id) {
      alert('No puedes desactivar tu propia cuenta activa.');
      return;
    }

    try {
      const res = await fetch(`/api/usuarios/${targetUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !targetUser.activo })
      });
      if (res.ok) {
        fetchUsersAndRoles();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al cambiar estado de cuenta');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pl-16 md:pl-56 transition-all duration-300 flex flex-col font-sans text-[#111827] pb-12">
      <Sidebar />

      {/* HEADER */}
      <header className="h-16 px-6 border-b border-gray-100 bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm shadow-gray-50/20">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h2>
          <p className="text-[10px] text-gray-400 font-medium">Control corporativo de credenciales, roles y accesos.</p>
        </div>

        <div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="py-1.5 px-3 bg-purple-600 hover:bg-[#5B21B6] active:scale-95 text-xs text-white font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all outline-none"
            >
              <Plus size={13} />
              Añadir Usuario
            </button>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-grow p-8 space-y-8 max-w-7xl w-full mx-auto">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-start gap-2.5 text-left animate-shake">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* USER SYSTEM LIST */}
          <section className={`bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden ${showAddForm ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5 leading-none">
                <Users size={16} className="text-purple-600" />
                <span>Usuarios Guardados ({users.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="text-xs text-gray-400 font-medium uppercase tracking-wider bg-gray-50/50">
                  <tr className="border-b border-gray-100">
                    <th className="px-8 py-4">Información principal</th>
                    <th className="px-8 py-4">Email</th>
                    <th className="px-8 py-4 text-center">Rol</th>
                    <th className="px-8 py-4 text-center">Estado</th>
                    <th className="px-8 py-4 text-right">Switch de estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-gray-400"> Carga de usuarios... </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-gray-400"> No se encuentran usuarios en la plataforma. </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-55/50 transition-colors">
                        {/* Nombre */}
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2.5 text-left">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs uppercase shadow-sm">
                              {u.nombre.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-900">{u.nombre}</span>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-8 py-4 text-gray-500 font-mono select-all">
                          {u.email}
                        </td>
                        {/* Rol */}
                        <td className="px-8 py-4 text-center">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase border ${
                            u.rol.nombre === 'administrador'
                              ? 'bg-[#F5F3FF] text-[#5B21B6] border-purple-100'
                              : 'bg-gray-55 text-gray-650 border-gray-100'
                          }`}>
                            {u.rol.nombre}
                          </span>
                        </td>
                        {/* Estado */}
                        <td className="px-8 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            u.activo 
                              ? 'bg-[#DCFCE7] text-[#15803D]' 
                              : 'bg-[#FEE2E2] text-[#B91C1C]'
                          }`}>
                            {u.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        {/* Switch de estado */}
                        <td className="px-8 py-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={u.id === user?.id}
                            className="text-gray-400 hover:text-purple-600 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {u.activo ? (
                              <ToggleRight size={24} className="text-purple-600 inline-block" />
                            ) : (
                              <ToggleLeft size={24} className="text-gray-300 inline-block" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ADD USER CARD (SIDE FORM) */}
          {showAddForm && (
            <section className="bg-white rounded-xl border border-gray-150 shadow-sm p-6 text-left animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5 leading-none">
                  <User size={16} className="text-purple-600" />
                  <span>Nuevo Usuario</span>
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowLeft size={14} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej: Marcelo Alcocer"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-purple-500 text-xs text-gray-800"
                    />
                    <User size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="correo@sistema.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-purple-500 text-xs text-gray-800"
                    />
                    <Mail size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Contraseña</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Min 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-purple-500 text-xs text-gray-800"
                    />
                    <Key size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Asignar Rol</label>
                  <div className="relative">
                    <select
                      value={rolId}
                      onChange={(e) => setRolId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-purple-500 text-xs text-gray-700 font-semibold cursor-pointer"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                    <ShieldAlert size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 px-4 bg-purple-600 hover:bg-[#5B21B6] active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Crear Cuenta'}
                </button>
              </form>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
