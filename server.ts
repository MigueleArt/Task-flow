import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'incidencias-y-tareas-super-secret-key-987!';

app.use(express.json());

// Middleware: Authenticate Token
const authenticateToken = async (req: any, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Falta el token de autenticación (Unauthorized)' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Fetch latest user info from DB to make sure they are active
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: { rol: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'La cuenta de usuario está desactivada' });
    }

    req.user = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol.nombre,
      rolId: user.rolId
    };
    next();
  } catch (error) {
    console.error('Error al verificar JWT:', error);
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware: Authorize Roles
const authorizeRole = (...roles: string[]) => {
  return (req: any, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: No tienes los permisos requeridos' });
    }
    next();
  };
};

// ============================
// AUTH ENDPOINTS
// ============================

app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'El correo y la contraseña son obligatorios' });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Este usuario está inactivo. Contacte al administrador.' });
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol.nombre },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol.nombre,
        rolId: user.rolId
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor en inicio de sesión' });
  }
});

// POST /api/auth/register — Registro público (siempre como miembro)
app.post('/api/auth/register', async (req: express.Request, res: express.Response) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe una cuenta registrada con ese correo' });
    }

    // Siempre asignar rol de miembro en auto-registro
    const miembroRol = await prisma.rol.findFirst({ where: { nombre: 'miembro' } });
    if (!miembroRol) {
      return res.status(500).json({ error: 'Error de configuración del sistema (rol no encontrado)' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email,
        password: hashedPassword,
        rolId: miembroRol.id,
        activo: true,
      },
      select: { id: true, nombre: true, email: true, rol: true }
    });

    res.status(201).json({ message: 'Cuenta creada correctamente', usuario: newUser });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
});

// ============================
// USUARIOS ENDPOINTS (Solo Administrador)
// ============================

app.get('/api/usuarios', authenticateToken, authorizeRole('administrador'), async (req: express.Request, res: express.Response) => {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        creadoEn: true,
        rolId: true,
        rol: true
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/usuarios', authenticateToken, authorizeRole('administrador'), async (req: express.Request, res: express.Response) => {
  const { nombre, email, password, rolId, activo } = req.body;

  if (!nombre || !email || !password || !rolId) {
    return res.status(400).json({ error: 'Todos los campos (nombre, email, password, rolId) son obligatorios' });
  }

  try {
    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe un usuario registrado con este correo electrónico' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rolId: parseInt(rolId, 10),
        activo: activo !== undefined ? activo : true
      },
      include: {
        rol: true
      }
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar el usuario en el sistema' });
  }
});

app.get('/api/usuarios/:id', authenticateToken, authorizeRole('administrador'), async (req: express.Request, res: express.Response) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        creadoEn: true,
        rolId: true,
        rol: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ error: 'Error al obtener detalles del usuario' });
  }
});

app.patch('/api/usuarios/:id', authenticateToken, authorizeRole('administrador'), async (req: express.Request, res: express.Response) => {
  const userId = parseInt(req.params.id, 10);
  const { nombre, email, password, rolId, activo } = req.body;

  try {
    const dataToUpdate: any = {};
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (email !== undefined) {
      // Check email unique if changing
      const userWithEmail = await prisma.usuario.findFirst({
        where: { email, NOT: { id: userId } }
      });
      if (userWithEmail) {
        return res.status(400).json({ error: 'Ya existe otro usuario con este correo electrónico' });
      }
      dataToUpdate.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password, salt);
    }
    if (rolId !== undefined) dataToUpdate.rolId = parseInt(rolId, 10);
    if (activo !== undefined) dataToUpdate.activo = activo;

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: dataToUpdate,
      include: { rol: true }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al cambiar la información del usuario' });
  }
});

app.get('/api/roles', authenticateToken, authorizeRole('administrador'), async (req: express.Request, res: express.Response) => {
  try {
    const roles = await prisma.rol.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error al traer roles:', error);
    res.status(500).json({ error: 'Error al obtener roles de sistema' });
  }
});

// ============================
// PERFIL PROPIO (Cualquier usuario autenticado)
// ============================

// GET /api/me - Obtener perfil del usuario autenticado
app.get('/api/me', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { id: true, nombre: true, email: true, activo: true, creadoEn: true, rol: true }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al cargar el perfil' });
  }
});

// PATCH /api/me - Actualizar nombre o contraseña del usuario autenticado
app.patch('/api/me', authenticateToken, async (req: any, res: express.Response) => {
  const { nombre, passwordActual, passwordNuevo } = req.body;

  try {
    const user = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const dataToUpdate: any = {};

    if (nombre && nombre.trim()) {
      dataToUpdate.nombre = nombre.trim();
    }

    if (passwordNuevo) {
      if (!passwordActual) {
        return res.status(400).json({ error: 'Debes ingresar tu contraseña actual para cambiarla' });
      }
      const match = await bcrypt.compare(passwordActual, user.password);
      if (!match) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
      }
      if (passwordNuevo.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(passwordNuevo, salt);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: 'No hay cambios para guardar' });
    }

    const updated = await prisma.usuario.update({
      where: { id: req.user.id },
      data: dataToUpdate,
      select: { id: true, nombre: true, email: true, activo: true, creadoEn: true, rol: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al guardar los cambios del perfil' });
  }
});

// ============================
// TICKETS ENDPOINTS (Cualquier usuario)
// ============================

app.post('/api/tickets', authenticateToken, async (req: any, res: express.Response) => {
  const { titulo, descripcion, prioridad } = req.body;

  if (!titulo || !descripcion || !prioridad) {
    return res.status(400).json({ error: 'Título, descripción y prioridad son obligatorios' });
  }

  const validPrioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
  if (!validPrioridades.includes(prioridad.toUpperCase())) {
    return res.status(400).json({ error: `Prioridad inválida. Debe ser una de: ${validPrioridades.join(', ')}` });
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        titulo,
        descripcion,
        prioridad: prioridad.toUpperCase(),
        estado: 'ABIERTO',
        creadoPorId: req.user.id
      },
      include: {
        creadoPor: {
          select: { id: true, nombre: true, email: true }
        },
        asignadoA: {
          select: { id: true, nombre: true, email: true }
        }
      }
    });

    // Create history entry
    await prisma.historialTicket.create({
      data: {
        ticketId: ticket.id,
        usuarioId: req.user.id,
        estadoAnterior: 'NUEVO_REGISTRO',
        estadoNuevo: 'ABIERTO'
      }
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error al crear ticket:', error);
    res.status(500).json({ error: 'Error al registrar la incidencia' });
  }
});

app.get('/api/tickets', authenticateToken, async (req: any, res: express.Response) => {
  try {
    let tickets;
    if (req.user.rol === 'administrador') {
      // Admin sees ALL tickets
      tickets = await prisma.ticket.findMany({
        include: {
          creadoPor: { select: { id: true, nombre: true, email: true } },
          asignadoA: { select: { id: true, nombre: true, email: true } }
        },
        orderBy: { creadoEn: 'desc' }
      });
    } else {
      // Member sees tickets created by them OR assigned to them
      tickets = await prisma.ticket.findMany({
        where: {
          OR: [
            { creadoPorId: req.user.id },
            { asignadoAId: req.user.id }
          ]
        },
        include: {
          creadoPor: { select: { id: true, nombre: true, email: true } },
          asignadoA: { select: { id: true, nombre: true, email: true } }
        },
        orderBy: { creadoEn: 'desc' }
      });
    }
    res.json(tickets);
  } catch (error) {
    console.error('Error al consultar tickets:', error);
    res.status(500).json({ error: 'Error al obtener la lista de incidencias' });
  }
});

app.get('/api/tickets/:id', authenticateToken, async (req: any, res: express.Response) => {
  const ticketId = parseInt(req.params.id, 10);

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        creadoPor: { select: { id: true, nombre: true, email: true } },
        asignadoA: { select: { id: true, nombre: true, email: true } },
        comentarios: {
          include: {
            autor: { select: { id: true, nombre: true, email: true } }
          },
          orderBy: { creadoEn: 'desc' }
        },
        historiales: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } }
          },
          orderBy: { cambiadoEn: 'desc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    // Verify member permissions (must be creator, assignee, or admin)
    if (req.user.rol !== 'administrador' && ticket.creadoPorId !== req.user.id && ticket.asignadoAId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta incidencia' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error al traer detalles del ticket:', error);
    res.status(500).json({ error: 'Error al cargar detalles de la incidencia' });
  }
});

// PATCH /api/tickets/:id/asignar (solo admin)
app.patch('/api/tickets/:id/asignar', authenticateToken, authorizeRole('administrador'), async (req: any, res: express.Response) => {
  const ticketId = parseInt(req.params.id, 10);
  const { asignadoAId } = req.body; // Can be null to unassign

  try {
    const ticketObj = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticketObj) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const assignedUserId = asignadoAId ? parseInt(asignadoAId, 10) : null;
    if (assignedUserId) {
      const dbUser = await prisma.usuario.findUnique({ where: { id: assignedUserId } });
      if (!dbUser) {
        return res.status(400).json({ error: 'El usuario asignado no existe' });
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { asignadoAId: assignedUserId },
      include: {
        creadoPor: { select: { id: true, nombre: true, email: true } },
        asignadoA: { select: { id: true, nombre: true, email: true } }
      }
    });

    // Create history entry
    await prisma.historialTicket.create({
      data: {
        ticketId: ticketId,
        usuarioId: req.user.id,
        estadoAnterior: ticketObj.estado,
        estadoNuevo: `${ticketObj.estado} (Asignado a: ${updatedTicket.asignadoA?.nombre || 'Ninguno'})`
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error al asignar ticket:', error);
    res.status(500).json({ error: 'Error al cambiar el responsable' });
  }
});

// PATCH /api/tickets/:id/estado (admin: cualquiera / miembro: los suyos)
app.patch('/api/tickets/:id/estado', authenticateToken, async (req: any, res: express.Response) => {
  const ticketId = parseInt(req.params.id, 10);
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ error: 'El nuevo estado es obligatorio' });
  }

  const validEstados = ['ABIERTO', 'EN_PROCESO', 'EN_REVISION', 'RESUELTO', 'CERRADO'];
  const formattedEstado = estado.toUpperCase();
  if (!validEstados.includes(formattedEstado)) {
    return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${validEstados.join(', ')}` });
  }

  try {
    const ticketObj = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticketObj) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Check member permissions: can modify if creator, assignee, or admin
    if (req.user.rol !== 'administrador' && ticketObj.creadoPorId !== req.user.id && ticketObj.asignadoAId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para modificar el estado de esta incidencia' });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { estado: formattedEstado },
      include: {
        creadoPor: { select: { id: true, nombre: true, email: true } },
        asignadoA: { select: { id: true, nombre: true, email: true } }
      }
    });

    // Create history entry
    await prisma.historialTicket.create({
      data: {
        ticketId: ticketId,
        usuarioId: req.user.id,
        estadoAnterior: ticketObj.estado,
        estadoNuevo: formattedEstado
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error al cambiar de estado:', error);
    res.status(500).json({ error: 'Error al actualizar el estado de la incidencia' });
  }
});

// DELETE /api/tickets/:id (solo admin)
app.delete('/api/tickets/:id', authenticateToken, authorizeRole('administrador'), async (req: express.Request, res: express.Response) => {
  const ticketId = parseInt(req.params.id, 10);

  try {
    const ticketObj = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticketObj) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    await prisma.ticket.delete({
      where: { id: ticketId }
    });

    res.json({ success: true, message: 'Incidencia eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar ticket:', error);
    res.status(500).json({ error: 'Error al eliminar la incidencia del sistema' });
  }
});

// ============================
// COMENTARIOS ENDPOINTS
// ============================

app.post('/api/tickets/:id/comentarios', authenticateToken, async (req: any, res: express.Response) => {
  const ticketId = parseInt(req.params.id, 10);
  const { contenido } = req.body;

  if (!contenido || !contenido.trim()) {
    return res.status(400).json({ error: 'El contenido del comentario no puede estar vacío' });
  }

  try {
    const ticketObj = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticketObj) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    // Member must have access to the ticket
    if (req.user.rol !== 'administrador' && ticketObj.creadoPorId !== req.user.id && ticketObj.asignadoAId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para comentar en esta incidencia' });
    }

    const nuevoComentario = await prisma.comentario.create({
      data: {
        contenido: contenido.trim(),
        autorId: req.user.id,
        ticketId: ticketId
      },
      include: {
        autor: { select: { id: true, nombre: true, email: true } }
      }
    });

    res.status(201).json(nuevoComentario);
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error al enviar el comentario' });
  }
});

app.get('/api/tickets/:id/comentarios', authenticateToken, async (req: any, res: express.Response) => {
  const ticketId = parseInt(req.params.id, 10);

  try {
    const ticketObj = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticketObj) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    // Check permissions
    if (req.user.rol !== 'administrador' && ticketObj.creadoPorId !== req.user.id && ticketObj.asignadoAId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes accesos para ver los comentarios de esta incidencia' });
    }

    const comentarios = await prisma.comentario.findMany({
      where: { ticketId },
      include: {
        autor: { select: { id: true, nombre: true, email: true } }
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al cargar los comentarios' });
  }
});

// ============================
// DASHBOARD ENDPOINTS
// ============================

app.get('/api/dashboard', authenticateToken, async (req: any, res: express.Response) => {
  try {
    // If admin: stats for all. If member: stats for tickets where they are assignee or creator.
    const isUnionWhere = req.user.rol !== 'administrador'
      ? { OR: [{ creadoPorId: req.user.id }, { asignadoAId: req.user.id }] }
      : {};

    // Get group count by state
    const tickets = await prisma.ticket.findMany({
      where: isUnionWhere
    });

    const openCount = tickets.filter(t => t.estado === 'ABIERTO').length;
    const processCount = tickets.filter(t => t.estado === 'EN_PROCESO').length;
    const revisionCount = tickets.filter(t => t.estado === 'EN_REVISION').length;
    const resolvedCount = tickets.filter(t => t.estado === 'RESUELTO' || t.estado === 'CERRADO').length;
    
    // Urgent count
    const urgentCount = tickets.filter(t => t.prioridad === 'URGENTE' || t.prioridad === 'ALTA').length;

    // Total Users count
    const totalUsers = await prisma.usuario.count();

    // Since we need "Activos ahora", let's give a dynamic simulated value (e.g., number of active users, say we have 3 users, so we can mock a realistic count like 2 or 1, or let's use the actual count of usuarios who are active)
    const activeUsersCount = await prisma.usuario.count({ where: { activo: true } });

    res.json({
      abiertos: openCount,
      enProceso: processCount,
      enRevision: revisionCount,
      resueltos: resolvedCount,
      urgentes: urgentCount,
      totalIncidencias: tickets.length,
      totalUsuarios: totalUsers,
      activosAhora: activeUsersCount
    });
  } catch (error) {
    console.error('Error al traer estadísticas del dashboard:', error);
    res.status(500).json({ error: 'Error al cargar la información general de la página' });
  }
});

// ============================
// VITE AND STATIC ASSETS CONFIGURATION
// ============================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
