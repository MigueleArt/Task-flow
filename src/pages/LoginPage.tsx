import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Lock, Eye, EyeOff, Github, Chrome, Facebook, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingrese su email y contraseña.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      login(data.token, data.usuario);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F9FAFB] font-sans">
      
      {/* COLUMNA IZQUIERDA (40%) */}
      <div className="hidden md:flex w-[40%] bg-white flex-col justify-center px-12 relative overflow-hidden select-none border-r border-gray-100">
        
        {/* DECORACIÓN DE CÍRCULOS (Esquina superior derecha de la columna izquierda y flotantes) */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-gradient-to-tr from-[#3B82F6] to-[#7C3AED] rounded-full blur-[40px] opacity-80 z-0 animate-pulse duration-5000"></div>
        <div className="absolute top-[80px] right-[-30px] w-48 h-48 bg-[#5B21B6] rounded-full blur-[35px] opacity-90 z-0"></div>
        
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-none drop-shadow-sm">
            Task-flow
          </h1>
          <p className="text-gray-400 text-sm max-w-sm">
            Inicia sesión para gestionar todas tus tareas, incidencias y reportes del equipo de manera eficiente.
          </p>
        </div>

        {/* Ambient watermark footer layout of left side */}
        <div className="absolute bottom-8 left-12 text-xs text-gray-300 font-mono">
          Task-flow v1.0 • 2026/06
        </div>
      </div>

      {/* COLUMNA DERECHA (60% o 100% en mobile) */}
      <div className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-12 relative">
        
        {/* Decorative circle in mob background */}
        <div className="md:hidden absolute top-5 right-5 w-32 h-32 bg-purple-200 rounded-full blur-2xl opacity-55"></div>

        <div className="w-full max-w-md bg-white rounded-xl border border-gray-150 p-8 space-y-6 relative z-10 shadow-sm transition-all">
          <div className="text-center md:text-left space-y-1.5">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Inicio de sesión
            </h2>
            <p className="text-sm text-gray-400">
              Es bueno que estés de regreso :)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3.5 rounded-xl border border-red-100 flex items-start gap-2.5">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* INPUT EMAIL */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sistema.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-900"
                />
                <User size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            {/* INPUT PASSWORD */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Contraseña
                </label>
                <a 
                  href="#olvido" 
                  onClick={(e) => { e.preventDefault(); alert('Si olvidó su contraseña, contacte a su administrador de base de datos.'); }}
                  className="text-xs text-purple-600 hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-900"
                />
                <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-purple-600 outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* CHECKBOX RECORDARME */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 text-purple-650 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-medium">Recordarme</span>
              </label>
            </div>

            {/* BOTÓN INICIAR SESIÓN */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-[#5B21B6] active:scale-[0.99] disabled:bg-[#F5F3FF] disabled:text-gray-400 font-bold text-white rounded-lg shadow-sm transition-all text-xs flex items-center justify-center outline-none cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* OAUTH VISUAL DIVIDER */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-xs text-gray-300 font-medium font-mono">Or</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* OAUTH VISUAL ICONS */}
          <div className="grid grid-cols-3 gap-3">
            <button 
              type="button"
              onClick={() => alert('Método de ingreso demostrativo')}
              className="flex items-center justify-center py-2.5 px-4 border border-gray-150 rounded-lg bg-gray-50/30 hover:bg-gray-50 transition-colors"
            >
              <Chrome size={18} className="text-red-500" />
            </button>
            <button 
              type="button"
              onClick={() => alert('Método de ingreso demostrativo')}
              className="flex items-center justify-center py-2.5 px-4 border border-gray-150 rounded-lg bg-gray-50/30 hover:bg-gray-50 transition-colors"
            >
              <Facebook size={18} className="text-blue-600" />
            </button>
            <button 
              type="button"
              onClick={() => alert('Método de ingreso demostrativo')}
              className="flex items-center justify-center py-2.5 px-4 border border-gray-150 rounded-lg bg-gray-50/30 hover:bg-gray-50 transition-colors"
            >
              <Github size={18} className="text-gray-800" />
            </button>
          </div>

          {/* REGISTER LINK */}
          <div className="text-center text-xs text-gray-400 font-medium">
            ¿No tienes una cuenta? <span className="text-[#5B21B6] hover:underline cursor-pointer" onClick={() => alert('Contacte al Administrador para registrar una cuenta de miembro.')}>Regístrate</span>
          </div>

        </div>
      </div>

    </div>
  );
}
