# RentApp Monorepo

MVP para gestión de alquileres con Express + Prisma + Next.js.

## Requisitos

- Node.js 20
- npm 10
- Docker + Docker Compose
- Token de prueba de Mercado Pago (opcional para probar checkout)

## Puesta en marcha rápida

1. Cloná/copá `.env.example` a `.env` en la raíz (y opcionalmente a `apps/api/.env` si querés aislar variables).
2. Levantá la base de datos local:
   ```bash
   docker compose up -d
   ```
3. Instalá dependencias:
   ```bash
   npm install
   ```
4. Aplicá migraciones y generá el cliente Prisma (crea y seed del admin `admin@local.test / admin123`):
   ```bash
   npm run prisma:dev --workspace=@admin-inmo/api
   ```
5. Iniciá ambos servicios:
   ```bash
   npm run dev
   ```
6. Frontend: http://localhost:3000 - API: http://localhost:4000.

### Scripts útiles

- `npm run dev --workspace=@admin-inmo/api`: API en modo desarrollo
- `npm run dev --workspace=@admin-inmo/web`: Frontend en modo desarrollo
- `npm run build --workspace=@admin-inmo/api && npm run start --workspace=@admin-inmo/api`: build + start de la API

## Estructura

```
apps/
  api/        # Express + Prisma + Mercado Pago + JWT roles
  web/        # Next.js 14 App Router + Tailwind + shadcn-like UI
  shared/     # Tipos compartidos y constantes
```

## API (apps/api)

- JWT + roles: `ADMIN`, `PROPIETARIO`, `INQUILINO`
- Middleware: helmet, rate-limit, cors, cookie-parser, multer (uploads locales en `apps/api/uploads`)
- Prisma + PostgreSQL (Docker)
- Mercado Pago checkout + webhook
- Transferencia manual con carga de comprobantes y verificación administrativa
- Calculadora ICL/IPC con validación vía zod

### Endpoints principales (`/api`)

- `POST /auth/login` / `POST /auth/register` / `GET /auth/me` / `POST /auth/logout`
- `POST /usuarios` (ADMIN)
- `GET /contratos` / `POST /contratos` (ADMIN/PROPIETARIO)
- `POST /contratos/:id/archivos` + `GET /contratos/:id/archivos` + `GET /contratos/:id/archivos/:archivoId`
- `GET /contratos/:id/pagos` + `GET /contratos/:id/movimientos`
- `POST /pagos/generar` (ADMIN/PROPIETARIO)
- `POST /pagos/:pagoId/mp/preference`
- `POST /pagos/:pagoId/transferencia`
- `GET /pagos/:pagoId`
- `GET /transferencias/pendientes` (ADMIN)
- `POST /transferencias/:id/verificar` / `GET /transferencias/:id/comprobante`
- `GET /ajustes/calcular`
- `POST /webhook/mercadopago`

## Web (apps/web)

- Next.js 14 App Router, TailwindCSS, React Hook Form, zod, Zustand-ready store (sin estado global requerido aún).
- Autenticación vía rutas API internas (`/api/auth/*`) que guardan cookie httpOnly (`rentapp.token`).
- Dashboards según rol:
  - **Inquilino**: contrato activo, pagos pendientes, checkout Mercado Pago, carga de comprobante.
  - **Propietario**: alta de contratos, carga de archivos, generación de cargos mensuales.
  - **Admin**: revisión de transferencias y aprobación/rechazo.
- Calculadora ICL/IPC accesible desde el dashboard.

## Base de datos

- PostgreSQL 15 (Docker)
- Prisma schema en `apps/api/prisma/schema.prisma`
- Seed automático de usuario administrador (`admin@local.test / admin123`).

## Archivos y almacenamiento

- Uploads guardados en `apps/api/uploads` (agregá la carpeta a tus backups/volúmenes si usás Docker).
- Subcarpetas: `contracts/{contratoId}` y `proofs/{pagoId}`.

## Seguridad y validaciones

- Helmet, CORS restringido a `http://localhost:3000`
- Rate limit en rutas públicas y auth
- Multer con validación de mime/size + sanitización de nombres
- Autorización estricta por rol antes de servir recursos

## Próximos pasos sugeridos

- Completar UI para listar usuarios/seleccionar inquilinos desde la creación de contratos
- Agregar tests automáticos (API y UI)
- Configurar despliegues (Docker Compose extendido o infraestructura propia)
- Integrar notificaciones (email/SMS) para vencimientos
