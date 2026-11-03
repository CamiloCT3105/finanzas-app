# finanzas-app

Aplicación móvil de finanzas personales.

- **backend/**: API REST en Node.js + Express + PostgreSQL (TypeScript, JWT, bcrypt).
- **frontend/**: app en React Native con Expo SDK 58 y Expo Router (Android, iOS y web).

## Sprint 1 — historias implementadas

| Historia | Qué hace |
| --- | --- |
| HU-01 Crear cuenta | Registro con nombre, correo y contraseña (bcrypt). Correo único. |
| HU-02 Iniciar sesión | Login con JWT guardado en el dispositivo (SecureStore). Error genérico. |
| HU-03 Gestionar mi perfil | Ver y editar nombre y correo; cerrar sesión con confirmación. |
| HU-04 Registrar ingreso mensual | Ingreso con valor, tipo (salario, independiente, negocio, pensión, otro) y fecha. |
| HU-05 Registrar gastos fijos | Gasto tipo `fijo` con atajos para arriendo, servicios y transporte. |
| HU-06 Registrar gastos variables | Gasto tipo `variable` con fecha; lista del mes con valor, categoría y fecha. |
| HU-07 Asignar categoría | 8 categorías iniciales; la categoría es obligatoria. |
| HU-08 Editar o eliminar movimientos | Tocar un movimiento lo abre para editarlo; eliminar pide confirmación. |
| HU-09 Ver dinero disponible | Ingresos − gastos del mes, con aviso si el saldo es negativo. |
| HU-15 Crear meta de ahorro | Meta con nombre, valor objetivo, fecha límite y descripción opcionales. |

## Cómo ejecutarlo

Requisitos: Node.js 20+, PostgreSQL y, para el celular, la app **Expo Go**.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # completa DB_PASSWORD y JWT_SECRET
npm run db:init           # crea la base finanzas_app y sus tablas
npm run dev               # API en http://localhost:3000/api
```

### 2. Frontend

```bash
cd frontend
npm install
npx expo start
```

- Escanea el código QR con Expo Go (el celular debe estar en la misma red Wi-Fi que el computador).
- Presiona `w` para abrirla en el navegador.

La app detecta sola la IP del computador para conectarse a la API. Si necesitas otra URL, crea
`frontend/.env` con `EXPO_PUBLIC_API_URL=http://TU_IP:3000/api`.

## Endpoints

Todas las rutas, salvo `/api/auth/*`, requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/registro` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión |
| GET / PUT | `/api/usuarios/perfil` | Ver / editar perfil |
| GET | `/api/categorias` | Categorías activas |
| GET / POST | `/api/ingresos?mes=AAAA-MM` | Listar / registrar ingresos |
| PUT / DELETE | `/api/ingresos/:id` | Editar / eliminar ingreso |
| GET / POST | `/api/gastos?mes=AAAA-MM&tipo=fijo\|variable` | Listar / registrar gastos |
| PUT / DELETE | `/api/gastos/:id` | Editar / eliminar gasto |
| GET | `/api/resumen/disponible?mes=AAAA-MM` | Dinero disponible del mes |
| GET / POST | `/api/metas` | Listar / crear metas |
