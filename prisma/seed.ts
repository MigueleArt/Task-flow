import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding started...');

  // Create roles
  const adminRol = await prisma.rol.upsert({
    where: { nombre: 'administrador' },
    update: {},
    create: { nombre: 'administrador' },
  });

  const miembroRol = await prisma.rol.upsert({
    where: { nombre: 'miembro' },
    update: {},
    create: { nombre: 'miembro' },
  });

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin123!', salt);
  const miembroPassword = await bcrypt.hash('Miembro123!', salt);

  // Users
  const adminUsuario = await prisma.usuario.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      nombre: 'Evano',
      email: 'admin@sistema.com',
      password: adminPassword,
      rolId: adminRol.id,
      activo: true,
    },
  });

  const miembroUsuario = await prisma.usuario.upsert({
    where: { email: 'miembro@sistema.com' },
    update: {},
    create: {
      nombre: 'Juan Pérez',
      email: 'miembro@sistema.com',
      password: miembroPassword,
      rolId: miembroRol.id,
      activo: true,
    },
  });

  const miembroUsuario2 = await prisma.usuario.upsert({
    where: { email: 'maria@sistema.com' },
    update: {},
    create: {
      nombre: 'María López',
      email: 'maria@sistema.com',
      password: miembroPassword,
      rolId: miembroRol.id,
      activo: true,
    },
  });

  // Clean existing tickets
  await prisma.comentario.deleteMany();
  await prisma.historialTicket.deleteMany();
  await prisma.ticket.deleteMany();

  // Create 8 tickets of example
  const ticketsData = [
    {
      titulo: 'Incidencia #1',
      descripcion: 'El formulario de inicio de sesión experimenta lentitud intermitente debido a llamadas de red concurrentes sin optimizar en la verificación de firma digital de JWT.',
      prioridad: 'ALTA',
      estado: 'ABIERTO',
      creadoPorId: adminUsuario.id,
      asignadoAId: miembroUsuario.id,
    },
    {
      titulo: 'Incidencia #2',
      descripcion: 'Se reporta una fuga de memoria severa al cambiar repetidamente entre las vistas principal y de usuarios activos de forma consecutiva.',
      prioridad: 'MEDIA',
      estado: 'CERRADO',
      creadoPorId: miembroUsuario.id,
      asignadoAId: adminUsuario.id,
    },
    {
      titulo: 'Incidencia #3',
      descripcion: 'Algunas etiquetas del sidebar colapsable no se traducen de forma dinámica y conservan placeholders ingleses.',
      prioridad: 'BAJA',
      estado: 'CERRADO',
      creadoPorId: miembroUsuario2.id,
      asignadoAId: miembroUsuario.id,
    },
    {
      titulo: 'Incidencia #4',
      descripcion: 'Los avatares de los usuarios activos en línea demoran en renderizar debido a la resolución original de las imágenes subidas.',
      prioridad: 'BAJA',
      estado: 'ABIERTO',
      creadoPorId: miembroUsuario.id,
      asignadoAId: miembroUsuario2.id,
    },
    {
      titulo: 'Incidencia #5',
      descripcion: 'Un miembro con rol de lector puede solicitar la creación experimental de nuevos tickets directamente manipulando las llamadas del backend.',
      prioridad: 'ALTA',
      estado: 'ABIERTO',
      creadoPorId: adminUsuario.id,
      asignadoAId: miembroUsuario2.id,
    },
    {
      titulo: 'Incidencia #6',
      descripcion: 'El chevron de expansión del menú inferior del sidebar se bloquea si el ancho de pantalla es inferior a 640px de manera persistente.',
      prioridad: 'ALTA',
      estado: 'ABIERTO',
      creadoPorId: miembroUsuario.id,
      asignadoAId: adminUsuario.id,
    },
    {
      titulo: 'Incidencia #7',
      descripcion: 'Al filtrar por fecha reciente, no se descartan los tickets resueltos hace más de una semana.',
      prioridad: 'MEDIA',
      estado: 'ABIERTO',
      creadoPorId: miembroUsuario2.id,
      asignadoAId: miembroUsuario.id,
    },
    {
      titulo: 'Incidencia #8',
      descripcion: 'Aparecen notificaciones de sesión expirada duplicadas simultáneamente cuando la conexión local es interrumpida brevemente.',
      prioridad: 'MEDIA',
      estado: 'CERRADO',
      creadoPorId: adminUsuario.id,
      asignadoAId: miembroUsuario2.id,
    }
  ];

  const createdTickets = [];
  for (const t of ticketsData) {
    const ticket = await prisma.ticket.create({
      data: t
    });
    createdTickets.push(ticket);
  }

  // Comments for Ticket #1
  const firstTicket = createdTickets[0];
  await prisma.comentario.createMany({
    data: [
      {
        contenido: 'Tiene muy buena pinta, 10 para el diseñador ;)',
        autorId: miembroUsuario.id,
        ticketId: firstTicket.id,
        creadoEn: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      },
      {
        contenido: 'He revisado el código del middleware y encontré la causa raíz. Lo corregiré hoy mismo.',
        autorId: miembroUsuario.id,
        ticketId: firstTicket.id,
        creadoEn: new Date(Date.now() - 3600000 * 1), // 1 hour ago
      },
      {
        contenido: 'Excelente, manténme informado del progreso para aprobar los cambios.',
        autorId: adminUsuario.id,
        ticketId: firstTicket.id,
        creadoEn: new Date(Date.now() - 1800000), // 30 mins ago
      },
    ]
  });

  // Ticket History for Ticket #1
  await prisma.historialTicket.create({
    data: {
      ticketId: firstTicket.id,
      usuarioId: adminUsuario.id,
      estadoAnterior: 'CREADO',
      estadoNuevo: 'ABIERTO',
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
