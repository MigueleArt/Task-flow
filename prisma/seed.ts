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

  // Clean existing data
  await prisma.comentario.deleteMany();
  await prisma.historialTicket.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.usuario.deleteMany();

  // Users
  const joseMiguel = await prisma.usuario.upsert({
    where: { email: 'josemiguel@sistema.com' },
    update: {},
    create: {
      nombre: 'Jose Miguel',
      email: 'josemiguel@sistema.com',
      password: adminPassword,
      rolId: adminRol.id,
      activo: true,
    },
  });

  const alejandro = await prisma.usuario.upsert({
    where: { email: 'alejandro@sistema.com' },
    update: {},
    create: {
      nombre: 'Alejandro',
      email: 'alejandro@sistema.com',
      password: miembroPassword,
      rolId: miembroRol.id,
      activo: true,
    },
  });

  const eduardo = await prisma.usuario.upsert({
    where: { email: 'eduardo@sistema.com' },
    update: {},
    create: {
      nombre: 'Eduardo',
      email: 'eduardo@sistema.com',
      password: miembroPassword,
      rolId: miembroRol.id,
      activo: true,
    },
  });

  const javier = await prisma.usuario.upsert({
    where: { email: 'javier@sistema.com' },
    update: {},
    create: {
      nombre: 'Javier',
      email: 'javier@sistema.com',
      password: miembroPassword,
      rolId: miembroRol.id,
      activo: true,
    },
  });

  const breyan = await prisma.usuario.upsert({
    where: { email: 'breyan@sistema.com' },
    update: {},
    create: {
      nombre: 'Breyan',
      email: 'breyan@sistema.com',
      password: miembroPassword,
      rolId: miembroRol.id,
      activo: true,
    },
  });

  const concepcion = await prisma.usuario.upsert({
    where: { email: 'concepcion@sistema.com' },
    update: {},
    create: {
      nombre: 'Concepcion',
      email: 'concepcion@sistema.com',
      password: miembroPassword,
      rolId: miembroRol.id,
      activo: true,
    },
  });

  // Create 2 tickets
  await prisma.ticket.create({
    data: {
      titulo: 'Revisión de arquitectura del sistema',
      descripcion: 'Necesitamos revisar la arquitectura propuesta para la nueva plataforma antes de iniciar la etapa de desarrollo.',
      prioridad: 'ALTA',
      estado: 'ABIERTO',
      creadoPorId: joseMiguel.id,
      asignadoAId: alejandro.id,
    }
  });

  await prisma.ticket.create({
    data: {
      titulo: 'Configuración de entorno local',
      descripcion: 'Asistir a los nuevos miembros en la configuración de sus entornos locales con las variables de entorno necesarias.',
      prioridad: 'MEDIA',
      estado: 'EN_PROGRESO',
      creadoPorId: eduardo.id,
      asignadoAId: javier.id,
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
