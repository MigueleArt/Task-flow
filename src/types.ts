export interface Rol {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  creadoEn: string;
  rolId: number;
  rol: Rol;
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  estado: 'ABIERTO' | 'EN_PROCESO' | 'EN_REVISION' | 'RESUELTO' | 'CERRADO';
  creadoEn: string;
  creadoPorId: number;
  creadoPor: Partial<Usuario>;
  asignadoAId: number | null;
  asignadoA: Partial<Usuario> | null;
  comentarios?: Comentario[];
  historiales?: HistorialTicket[];
}

export interface Comentario {
  id: number;
  contenido: string;
  creadoEn: string;
  autorId: number;
  autor: Partial<Usuario>;
  ticketId: number;
}

export interface HistorialTicket {
  id: number;
  ticketId: number;
  usuarioId: number;
  usuario: Partial<Usuario>;
  estadoAnterior: string;
  estadoNuevo: string;
  cambiadoEn: string;
}

export interface AuthContextType {
  user: { id: number; nombre: string; email: string; rol: string; rolId: number } | null;
  token: string | null;
  login: (token: string, user: { id: number; nombre: string; email: string; rol: string; rolId: number }) => void;
  logout: () => void;
  isAdmin: boolean;
}
