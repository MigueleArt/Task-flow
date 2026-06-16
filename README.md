# Sistema de Gestión de Incidencias y Tareas

Este sistema es una solución full-stack robusta e interactiva para el reporte, asignación y seguimiento de incidencias técnicas corporativas, equipada con autenticación por roles (Administradores y Miembros), comentarios en tiempo real e historiales de auditoría.

---

## Stack Tecnológico

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, React Router v6
- **Backend**: Node.js, Express, TypeScript (`tsx`), JWT, Bcrypt
- **Base de Datos & ORM**: SQLite con Prisma ORM (ideal para contenedores Cloud Run con persistencia local ultrarrápida y cero coste de infraestructura).

---

## Cuentas de Acceso (Semilla de Base de Datos)

El sistema ya viene pre-sembrado con los siguientes usuarios de prueba:

- **Administrador**:
  - **Correo**: `admin@sistema.com`
  - **Contraseña**: `Admin123!`
- **Miembro de Soporte**:
  - **Correo**: `miembro@sistema.com`
  - **Contraseña**: `Miembro123!`

---

## Instrucciones para Ejecutar el Proyecto

### 1. Instrucciones de instalación de paquetes
Las dependencias ya están pre-instaladas en el entorno. Si deseas instalarlo por primera vez de forma local, ejecuta:
```bash
npm install
```

### 2. Sincronizar y Sembrar la Base de Datos
Para generar el cliente y propagar el esquema de base de datos relacional junto a los registros semilla:
```bash
# Sincroniza esquema de base de datos
npx prisma db push

# Ejecuta el script de semilla (crea roles, usuarios jefe, 8 tickets, comentarios)
npx tsx prisma/seed.ts
```

### 3. Servidor de Desarrollo Full-Stack (Express + Vite)
Inicia la aplicación en modo desarrollo. Servirá las rutas API y montará el middleware interactivo de Vite en el puerto `3000`:
```bash
npm run dev
```

### 4. Compilación de Producción
Genera el compilado estático del frontend y empaqueta el servidor Express CommonJS utilizando `esbuild` en la carpeta `dist/`:
```bash
npm run build
```

### 5. Iniciar en Producción
Para iniciar el servidor Node compilado en modo producción independiente:
```bash
npm run start
```
