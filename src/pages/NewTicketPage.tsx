import React, { useState } from 'react';
import { useNavigate as useNav } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function NewTicketPage() {
  const { token } = useAuth();
  const navigate = useNav();

  const [titulo, setTitulo] = useState('');
  const [prioridad, setPrioridad] = useState('BAJA');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !descripcion) {
      setError('Por favor complete el título y la descripción de la incidencia.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          prioridad
        })
      });

      const data = await res.json();
      if (res.ok) {
        navigate('/');
      } else {
        throw new Error(data.error || 'Error al registrar incidencia');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans p-6 md:p-12 flex flex-col justify-start text-[#111827]">
      
      {/* HEADER: Regresar utility */}
      <div className="max-w-2xl w-full mx-auto mb-10 text-left">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 py-2 px-5 bg-white shadow-sm border border-gray-150 rounded-lg hover:bg-gray-50 active:scale-95 text-sm text-gray-700 font-semibold transition-all duration-150 outline-none cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center font-bold">
            <ArrowLeft size={14} className="text-gray-500" />
          </div>
          Regresar
        </button>
      </div>

      {/* CENTRAL CARD FOR FORM */}
      <div className="max-w-xl w-full mx-auto bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden p-8 md:p-10 relative">
        
        {/* Form Title */}
        <div className="text-left border-b border-gray-50 pb-5 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Registro de incidencia
          </h2>
          <p className="text-xs text-gray-400 mt-1">Inicie un ticket técnico de soporte para alertar al equipo.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-start gap-2.5 mb-6 text-left">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* TWO COLUMNS RAW FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            
            {/* Campo Título */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                Título
              </label>
              <input
                type="text"
                placeholder="Ingrese un título"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-800"
              />
            </div>

            {/* Campo Prioridad */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                Prioridad
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-2002 outline-none rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-700 font-semibold cursor-pointer"
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

          </div>

          {/* Campo Descripción */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
              Descripción
            </label>
            <textarea
              rows={6}
              placeholder="Agregue una descripción de la incidencia"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm text-gray-800 resize-none min-h-[140px]"
            ></textarea>
          </div>

          {/* BOTÓN REGISTRAR */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-purple-600 hover:bg-[#5B21B6] active:scale-[0.99] disabled:bg-[#F5F3FF] disabled:text-gray-400 font-bold text-white rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 outline-none cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
            ) : (
              <>
                <span>Registrar</span>
                <span>→</span>
              </>
            )}
          </button>

        </form>

      </div>

    </div>
  );
}
