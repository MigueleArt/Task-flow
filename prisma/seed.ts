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
