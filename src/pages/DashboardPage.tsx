import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Ticket, Usuario } from '../types.ts';
import { 
  Search, 
  Monitor, 
  User as UserIcon, 
  Users, 
  Plus, 
  ChevronRight, 
  Clock, 
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export default function DashboardPage() {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();

  // State managers
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({
    abiertos: 0,
    enProceso: 0,
    enRevision: 0,
    resueltos: 0,
    urgentes: 0,
    totalIncidencias: 0,
    totalUsuarios: 0,
    activosAhora: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table actions
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ABIERTO, EN_PROCESO, CERRADO, etc.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Detail panel manager (Page 3)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [allUsers, setAllUsers] = useState<Usuario[]>([]); // for assigning
  const [commentsFilter, setCommentsFilter] = useState('recientes');

  // Fetch Dashboard and Tickets
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      
      // 1. Fetch Stats
      const statsRes = await fetch('/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);

      // 2. Fetch Tickets list
      const ticketsRes = await fetch('/api/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ticketsData = await ticketsRes.json();
      if (ticketsRes.ok) {
        setTickets(ticketsData);
      } else {
        throw new Error(ticketsData.error || 'Error al descargar incidencias');
      }

      // 3. Fetch Users (if admin) to support assignee assignments in details
      if (isAdmin) {
        const usersRes = await fetch('/api/usuarios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        if (usersRes.ok) setAllUsers(usersData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Fetch individual ticket detail with comments and histories
  const fetchTicketDetail = async (ticketId: number) => {
    if (!token) return;
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(data);
      } else {
        alert(data.error || 'Error al abrir detalles de la incidencia');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Create comment handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTicket || !newComment.trim()) return;

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contenido: newComment })
      });
      
      const data = await res.json();
      if (res.ok) {
        setNewComment('');
        // Refresh ticket details to include comment
        fetchTicketDetail(selectedTicket.id);
      } else {
        alert(data.error || 'No se pudo enviar el comentario');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign user handler
  const handleAssignUser = async (userIdStr: string) => {
    if (!token || !selectedTicket) return;
    const assignedUserId = userIdStr ? parseInt(userIdStr, 10) : null;

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/asignar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ asignadoAId: assignedUserId })
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh detail and list
        fetchTicketDetail(selectedTicket.id);
        fetchData();
      } else {
        alert(data.error || 'Error al cambiar responsable');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change status handler
  const handleUpdateStatus = async (newStatus: string) => {
    if (!token || !selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh detail and lists
        fetchTicketDetail(selectedTicket.id);
        fetchData();
      } else {
        alert(data.error || 'No se pudo cambiar el estado');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete ticket handler (Admin only)
  const handleDeleteTicket = async (ticketId: number) => {
    if (!token || !isAdmin) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este ticket permanentemente?')) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(null);
        fetchData();
      } else {
        alert(data.error || 'No se pudo eliminar la incidencia');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get active priority colors
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENTE':
      case 'ALTA':
        return 'text-red-500 font-semibold';
      case 'MEDIA':
        return 'text-orange-400 font-medium';
      default:
        return 'text-gray-400 font-medium';
    }
  };

  // Get status pill colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ABIERTO':
        return 'bg-[#DCFCE7] text-[#15803D] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider';
      case 'CERRADO':
      case 'RESUELTO':
        return 'bg-[#FEE2E2] text-[#B91C1C] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider';
      case 'EN_PROCESO':
        return 'bg-[#EFF6FF] text-[#1D4ED8] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider';
      case 'EN_REVISION':
        return 'bg-[#FEF3C7] text-[#D97706] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider';
      default:
        return 'bg-[#F3F4F6] text-[#4B5563] px-3 py-1 rounded-full text-xs font-medium uppercase';
    }
  };

  // Filter & Search Tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && ticket.estado === statusFilter;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pl-16 md:pl-56 transition-all duration-300 flex flex-col font-sans text-[#111827] pb-12">
      {/* SIDEBAR COMPONENT */}
      <Sidebar />

      {/* HEADER SECTION */}
      <header className="h-16 px-6 border-b border-gray-100 bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm shadow-gray-50/20">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Hello {user?.nombre || 'Usuario'} 👋
          </h2>
          <span className="text-gray-400 text-xs font-medium hidden sm:inline-block bg-gray-100/60 px-2.5 py-1 rounded-lg">
            {user?.rol === 'administrador' ? 'Módulo Administrativo' : 'Equipo de Soporte'}
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-48 sm:w-64">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all text-gray-800"
          />
          <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
        </div>
      </header>

      {/* CORE GRID LAYOUT */}
      <main className="flex-grow p-8 space-y-8 max-w-7xl w-full mx-auto">
        
        {/* STATS DE CORTE (3 CARDS ROW) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* CARD 1 - Total de Incidencias */}
          <div className="bg-white rounded-xl border border-gray-105 shadow-sm p-6 flex items-center space-x-4 hover:scale-[1.01] transition-transform">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-[#10B981] flex-shrink-0">
              <Monitor size={28} />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total de incidencias</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalIncidencias}</h3>
            </div>
          </div>

          {/* CARD 2 - Usuarios */}
          <div className="bg-white rounded-xl border border-gray-105 shadow-sm p-6 flex items-center space-x-4 hover:scale-[1.01] transition-transform">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-[#3B82F6] flex-shrink-0">
              <Users size={28} />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Usuarios</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsuarios}</h3>
            </div>
          </div>

          {/* CARD 3 - Activos ahora */}
          <div className="bg-white rounded-xl border border-gray-105 shadow-sm p-6 flex items-center justify-between hover:scale-[1.01] transition-transform">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-500 flex-shrink-0">
                <UserIcon size={28} />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Activos ahora</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse self-center"></span>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.activosAhora}</h3>
                </div>
              </div>
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-400 flex items-center justify-center text-[10px] text-white font-bold">AJ</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-purple-400 flex items-center justify-center text-[10px] text-white font-bold">RS</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">+5</div>
            </div>
          </div>

        </section>

        {/* INCIDENCIAS TABLE CONTAINER CARD */}
        <section className="bg-white rounded-xl border border-gray-150 shadow-sm flex-1 flex flex-col overflow-hidden">
          
          <div className="px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Incidencias</h2>

            {/* Inline Table Filters & Register button */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar incidencia..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-gray-50 border-none rounded-lg py-1.5 pl-8 pr-4 text-xs focus:ring-1 focus:ring-[#5B21B6] outline-none w-48 text-gray-800"
                />
                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1.5 pl-3 pr-8 text-xs font-semibold text-gray-850 bg-gray-50 border-none rounded-lg cursor-pointer outline-none"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ABIERTO">Abiertos</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="EN_REVISION">En Revisión</option>
                <option value="CERRADO">Cerrados</option>
              </select>

              <button
                onClick={() => navigate('/tickets/nuevo')}
                className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all font-sans"
              >
                <Plus size={13} />
                Nuevo
              </button>
            </div>
          </div>

          {/* TABLE COMPONENT */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-xs text-gray-400 font-medium uppercase tracking-wider bg-gray-50/50">
                <tr className="border-b border-gray-100">
                  <th className="px-8 py-4">Título</th>
                  <th className="px-8 py-4">Descripción</th>
                  <th className="px-8 py-4 text-center">Prioridad</th>
                  <th className="px-8 py-4 text-center">Estado</th>
                  <th className="px-8 py-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400">
                      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Cargando incidencias...
                    </td>
                  </tr>
                ) : currentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400">
                      No se encontraron incidencias activas.
                    </td>
                  </tr>
                ) : (
                  currentTickets.map((t) => (
                    <tr 
                      key={t.id} 
                      onClick={() => fetchTicketDetail(t.id)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      {/* Titulo */}
                      <td className="px-8 py-4 font-semibold text-gray-900 select-none max-w-xs truncate">
                        {t.titulo}
                      </td>
                      {/* Descripcion */}
                      <td className="px-8 py-4 text-gray-500 max-w-sm truncate select-none text-xs">
                        {t.descripcion}
                      </td>
                      {/* Prioridad */}
                      <td className={`px-8 py-4 text-center ${getPriorityStyle(t.prioridad)} text-xs uppercase select-none`}>
                        {t.prioridad}
                      </td>
                      {/* Estado */}
                      <td className="px-8 py-4 text-center select-none text-xs">
                        <span className={getStatusBadge(t.estado)}>
                          {t.estado === 'ABIERTO' ? 'Abierto' : t.estado === 'CERRADO' ? 'Cerrado' : t.estado.replace('_', ' ')}
                        </span>
                      </td>
                      {/* Ver Mas */}
                      <td className="px-8 py-4 text-right text-gray-400">
                        <button className="text-purple-600 hover:text-[#5B21B6] p-1 rounded-lg hover:bg-[#F5F3FF] transition-colors">
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE PAGINATION */}
          {!loading && (
            <div className="px-8 py-4 flex items-center justify-between border-t border-gray-50 text-xs text-gray-400">
              <p>
                Mostrando datos de {filteredTickets.length > 0 ? indexOfFirstItem + 1 : 0} a {Math.min(indexOfLastItem, filteredTickets.length)} de {filteredTickets.length} entradas
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center bg-white text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => goToPage(pg)}
                    className={`w-8 h-8 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      currentPage === pg
                        ? 'border-[#5B21B6] bg-[#5B21B6] text-white font-semibold'
                        : 'border-gray-250 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center bg-white text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ======================================================= */}
      {/* PÁGINA 3 — INCIDENCE DETAIL PANEL (RIGHT ALIGNED FLYOUT) */}
      {/* ======================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-40 flex justify-end">
          
          {/* Backdrop Blur overlay */}
          <div 
            onClick={() => setSelectedTicket(null)}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity"
          ></div>

          {/* Right Flyout panel */}
          <div className="relative w-full max-w-2xl bg-white h-screen shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
            
            {/* Panel Header */}
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 px-2.5 bg-gray-50 hover:bg-gray-100/80 active:scale-95 text-xs text-gray-500 rounded-lg outline-none cursor-pointer border border-gray-100 flex items-center gap-1 hover:text-gray-900 transition-all font-semibold"
                >
                  <ArrowLeft size={12} />
                  Cerrar
                </button>
                <span className="text-gray-300">|</span>
                <h4 className="text-base font-bold text-gray-900 tracking-tight">
                  Incidencia #{selectedTicket.id}
                </h4>
              </div>
              
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="py-1 px-2.5 bg-red-50 hover:bg-red-100/80 active:scale-95 text-[10px] text-red-600 rounded-full outline-none cursor-pointer border border-red-100 flex items-center font-bold uppercase tracking-wider transition-all"
                    title="Eliminar permanentemente"
                  >
                    Eliminar
                  </button>
                )}
                <span className={getStatusBadge(selectedTicket.estado)}>
                  {selectedTicket.estado === 'ABIERTO' ? 'Abierto' : selectedTicket.estado === 'CERRADO' ? 'Cerrado' : selectedTicket.estado.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Panel Body Content (Scrollable) */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 text-left">
              
              {detailLoading ? (
                <div className="py-24 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Cargando información ampliada de la incidencia...
                </div>
              ) : (
                <>
                  {/* Status / Assignee Quick controllers */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Change Status control */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Modificar Estado</label>
                      <select
                        value={selectedTicket.estado}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="w-full py-1.5 pl-3 pr-8 bg-white border border-gray-200 outline-none rounded-lg text-xs font-semibold text-gray-700 cursor-pointer"
                      >
                        <option value="ABIERTO">ABIERTO</option>
                        <option value="EN_PROCESO">EN PROCESO</option>
                        <option value="EN_REVISION">EN REVISIÓN</option>
                        <option value="RESUELTO">RESUELTO</option>
                        <option value="CERRADO">CERRADO</option>
                      </select>
                    </div>

                    {/* Change Assignee (admin only) */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <UserCheck size={10} />
                        Asinar Responsable (Admin)
                      </label>
                      <select
                        disabled={!isAdmin}
                        value={selectedTicket.asignadoAId || ''}
                        onChange={(e) => handleAssignUser(e.target.value)}
                        className="w-full py-1.5 pl-3 pr-8 bg-white border border-gray-200 outline-none rounded-lg text-xs font-semibold text-gray-700 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Sin Asignar (Ninguno)</option>
                        {allUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.nombre}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Section: Descripción */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block font-sans">
                      Descripción
                    </label>
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed font-sans select-text">
                      <p className="whitespace-pre-line">{selectedTicket.descripcion}</p>
                    </div>
                  </div>

                  {/* Meta data row */}
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-50 pb-6 whitespace-nowrap">
                    
                    {/* Meta: Prioridad */}
                    <div className="space-y-1 bg-red-50/30 p-3 rounded-xl border border-red-100/40">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prioridad</p>
                      <p className="text-sm font-black text-red-500 uppercase tracking-wide">
                        {selectedTicket.prioridad}
                      </p>
                    </div>

                    {/* Meta: Responsable */}
                    <div className="space-y-1 bg-blue-50/30 p-3 rounded-xl border border-blue-100/40 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center text-sm uppercase">
                        {(selectedTicket.asignadoA?.nombre || 'S').charAt(0)}
                      </div>
                      <div className="text-left leading-none">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Responsable</p>
                        <p className="text-xs font-bold text-gray-800 pt-0.5 truncate max-w-[150px]">
                          {selectedTicket.asignadoA?.nombre || 'Sin asignar'}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Section: Comentarios (Header & list) */}
                  <div className="space-y-4 flex-grow flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                        <MessageSquare size={16} className="text-purple-600" />
                        <h5 className="font-semibold text-sm">Comentarios</h5>
                      </div>
                      
                      {/* Comments filter */}
                      <select
                        value={commentsFilter}
                        onChange={(e) => setCommentsFilter(e.target.value)}
                        className="py-1 px-2.5 text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 outline-none rounded-lg cursor-pointer"
                      >
                        <option value="recientes">Filtro: Recientes</option>
                      </select>
                    </div>

                    {/* Comments list */}
                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-2">
                      {!selectedTicket.comentarios || selectedTicket.comentarios.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-4">No hay comentarios en esta incidencia aún. ¡Escribe el primero!</p>
                      ) : (
                        selectedTicket.comentarios.map((comment) => (
                          <div key={comment.id} className="flex gap-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-100/60 font-sans">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-xs uppercase flex-shrink-0 mt-0.5">
                              {(comment.autor?.nombre || 'U').charAt(0)}
                            </div>
                            <div className="space-y-1 text-left flex-grow">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-gray-800">{comment.autor?.nombre}</span>
                                <span className="text-[9px] text-gray-400 font-mono flex items-center gap-0.5">
                                  <Clock size={8} />
                                  {new Date(comment.creadoEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-normal">{comment.contenido}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Incidencia History log (sutil) */}
                    {selectedTicket.historiales && selectedTicket.historiales.length > 0 && (
                      <div className="pt-4 border-t border-gray-50">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Historial de actualizaciones</label>
                        <div className="space-y-1.5 max-h-[80px] overflow-y-auto font-mono text-[9px] text-gray-400">
                          {selectedTicket.historiales.map((h) => (
                            <div key={h.id} className="flex justify-between items-start">
                              <span>• Cambiado a estado: <strong className="text-gray-500">{h.estadoNuevo}</strong> por {h.usuario?.nombre}</span>
                              <span className="flex-shrink-0 ml-2">{new Date(h.cambiadoEn).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </>
              )}

            </div>

            {/* Input Footer for writing comments */}
            {!detailLoading && (
              <form onSubmit={handleAddComment} className="p-4 border-t border-gray-100 bg-white flex-shrink-0 flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe tu opinión..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-grow pl-4 pr-3 py-2.5 bg-gray-50 border border-gray-250 outline-none rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-xs text-gray-800 font-sans"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-md transition-all font-sans"
                >
                  Comentar
                </button>
              </form>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
