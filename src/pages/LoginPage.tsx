import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Mail, ArrowLeft, Activity } from 'lucide-react';

type View = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');

  // ── Campos compartidos ──────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Campos de registro ──────────────────
  const [nombre, setNombre] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const switchView = (v: View) => {
    setView(v);
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setNombre('');
    setPasswordConfirm('');
  };

  // ── Login ───────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Ingresa tu correo y contraseña.'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
      login(data.token, data.usuario);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // ── Registro ────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email || !password || !passwordConfirm) {
      setError('Todos los campos son obligatorios.'); return;
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.'); return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.'); return;
    }
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar cuenta');
      setSuccess('¡Cuenta creada correctamente! Ahora puedes iniciar sesión.');
      setTimeout(() => switchView('login'), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Olvidé contraseña ───────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Ingresa tu correo electrónico.'); return; }
    setError(null); setLoading(true);
    // Simula proceso — en un sistema real enviaría un correo
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSuccess('Si tu correo está registrado, recibirás instrucciones. Contacta a tu administrador si el problema persiste.');
  };

  // ── Barra de fortaleza de contraseña ────
  const strengthLevel = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 9 ? 2 : password.length < 12 ? 3 : 4;
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'][strengthLevel];
  const strengthLabel = ['', 'Muy débil', 'Débil', 'Moderada', 'Fuerte'][strengthLevel];

  return (
    <div className="min-h-screen w-full flex bg-[#F9FAFB] font-sans">

      {/* ── COLUMNA IZQUIERDA ── */}
      <div className="hidden md:flex w-[40%] bg-white flex-col justify-center px-12 relative overflow-hidden select-none border-r border-gray-100">
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-gradient-to-tr from-[#3B82F6] to-[#7C3AED] rounded-full blur-[40px] opacity-80 z-0 animate-pulse" />
        <div className="absolute top-[80px] right-[-30px] w-48 h-48 bg-[#5B21B6] rounded-full blur-[35px] opacity-90 z-0" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Activity size={22} className="text-white" />
            </div>
            <span className="text-4xl font-black text-gray-900 tracking-tight">Task-flow</span>
          </div>
          <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
            {view === 'login' && 'Inicia sesión para gestionar tus tareas e incidencias de equipo.'}
            {view === 'register' && 'Crea tu cuenta para unirte al equipo y empezar a colaborar.'}
            {view === 'forgot' && 'Te ayudamos a recuperar el acceso a tu cuenta.'}
          </p>
        </div>
        <div className="absolute bottom-8 left-12 text-xs text-gray-300 font-mono">
          Task-flow v1.0 • 2026/06
        </div>
      </div>

      {/* ── COLUMNA DERECHA ── */}
      <div className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-12 relative">
        <div className="md:hidden absolute top-5 right-5 w-32 h-32 bg-purple-200 rounded-full blur-2xl opacity-55" />

        <div className="w-full max-w-md bg-white rounded-xl border border-gray-150 p-8 space-y-6 relative z-10 shadow-sm">

          {/* Botón volver */}
          {view !== 'login' && (
            <button
              onClick={() => switchView('login')}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors -mb-2"
            >
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </button>
          )}

          {/* Encabezado */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {view === 'login' && 'Inicio de sesión'}
              {view === 'register' && 'Crear cuenta'}
              {view === 'forgot' && 'Recuperar contraseña'}
            </h2>
            <p className="text-sm text-gray-400">
              {view === 'login' && 'Es bueno que estés de regreso :)'}
              {view === 'register' && 'Completa los datos para registrarte como miembro.'}
              {view === 'forgot' && 'Ingresa tu correo y te indicaremos los pasos a seguir.'}
            </p>
          </div>

          {/* Alertas */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3.5 rounded-xl border border-red-100 flex items-start gap-2.5">
              <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 text-sm p-3.5 rounded-xl border border-green-100 flex items-start gap-2.5">
              <CheckCircle size={17} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* ══════════════════════════════════════
              VISTA: LOGIN
          ══════════════════════════════════════ */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
                <div className="relative">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@sistema.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-900" />
                  <User size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contraseña</label>
                  <button type="button" onClick={() => switchView('forgot')}
                    className="text-xs text-purple-600 hover:underline font-medium">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-900" />
                  <Lock size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-purple-600 outline-none">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-[#5B21B6] active:scale-[0.99] disabled:opacity-60 font-bold text-white rounded-lg shadow-sm transition-all text-xs flex items-center justify-center outline-none cursor-pointer">
                {loading ? <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" /> : 'Iniciar Sesión'}
              </button>

              <div className="text-center text-xs text-gray-400 font-medium pt-1">
                ¿No tienes una cuenta?{' '}
                <button type="button" onClick={() => switchView('register')}
                  className="text-[#5B21B6] hover:underline font-semibold">
                  Regístrate aquí
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════
              VISTA: REGISTRO
          ══════════════════════════════════════ */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                <div className="relative">
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-900" />
                  <User size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
                <div className="relative">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-900" />
                  <Mail size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-900" />
                  <Lock size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-purple-600 outline-none">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {/* Barra de fortaleza */}
                {password && (
                  <div className="space-y-1 px-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${strengthLevel >= n ? strengthColor : 'bg-gray-100'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400">{strengthLabel}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Confirmar Contraseña</label>
                <div className="relative">
                  <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border outline-none rounded-lg transition-all text-sm text-gray-900 ${
                      passwordConfirm && password !== passwordConfirm
                        ? 'border-red-300 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                    }`} />
                  <Lock size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                </div>
                {passwordConfirm && password !== passwordConfirm && (
                  <p className="text-[11px] text-red-500 pl-1">Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                <strong>Nota:</strong> Las nuevas cuentas se registran como <strong>Miembro de Soporte</strong>. Un administrador puede cambiar el rol después.
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-[#5B21B6] active:scale-[0.99] disabled:opacity-60 font-bold text-white rounded-lg shadow-sm transition-all text-xs flex items-center justify-center outline-none cursor-pointer">
                {loading ? <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" /> : 'Crear Cuenta'}
              </button>

              <div className="text-center text-xs text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => switchView('login')}
                  className="text-[#5B21B6] hover:underline font-semibold">
                  Inicia sesión
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════
              VISTA: OLVIDÉ CONTRASEÑA
          ══════════════════════════════════════ */}
          {view === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                Ingresa tu correo y te indicaremos los pasos. Si el problema persiste, contacta directamente a tu administrador del sistema.
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
                <div className="relative">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-900" />
                  <Mail size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-[#5B21B6] active:scale-[0.99] disabled:opacity-60 font-bold text-white rounded-lg shadow-sm transition-all text-xs flex items-center justify-center outline-none cursor-pointer">
                {loading ? <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" /> : 'Enviar Instrucciones'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
