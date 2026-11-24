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

## Sprint 2 — historias implementadas

| Historia | Qué hace |
| --- | --- |
| HU-10 Ver capacidad de ahorro | (ingresos − gastos) ÷ ingresos × 100 del mes; mensaje si no hay ingresos. |
| HU-11 Ver dashboard financiero | Inicio con ingreso, gastos, disponible, ahorro del mes, capacidad, racha y progreso de metas. |
| HU-12 Ver resumen mensual | Pestaña Análisis: totales, disponible, ahorro y avance de metas del mes elegido. |
| HU-13 Ver gráficas de gastos | Gráfica de dona con el porcentaje de cada categoría. |
| HU-14 Comparar meses | Gastos del mes contra el mes anterior, con diferencia, porcentaje e indicador. |
| HU-16 Calcular meses para la meta | (objetivo − ahorrado) ÷ capacidad mensual, redondeado hacia arriba, con fecha aproximada. |
| HU-17 Registrar ahorro | Aporte a una meta en una transacción; la meta se marca cumplida al llegar al objetivo. |
| HU-18 Ver progreso de metas | Restante, porcentaje, barra de avance, tiempo estimado e historial de aportes. |
| HU-19 Elegir un reto de ahorro | Catálogo de retos; un reto activo a la vez con su fecha de fin. |
| HU-20 Registrar gasto evitado | El dinero que no se gastó se suma a una meta como aporte `gasto_evitado`. |
| HU-21 Completar un reto | Avances que suman a una meta; se marca cumplido dentro del plazo o queda no cumplido al vencer. |
| HU-22 Ver mi racha de ahorro | Días seguidos con aportes; se reinicia tras un día completo sin ahorrar. |
| HU-23 Obtener logros | 7 logros que se otorgan una sola vez, con notificación al desbloquearlos. |
| HU-24 a HU-34 Administración | Panel para administradores: dashboard, usuarios (buscar, activar/desactivar, rol), detalle sin datos financieros, categorías, retos, actividad, reportes y solicitudes de soporte. |

### Crear el primer administrador

Regístrate en la app y luego, en la carpeta `backend`:

```bash
npm run db:admin -- tucorreo@ejemplo.com
```

Al iniciar sesión con esa cuenta entras directamente al panel administrativo. Desde ahí puedes asignar el rol de administrador a otras cuentas.

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

## Despliegue en la nube

La API va en Render, la base de datos en Neon y la app web en Render (sitio estático).
La guía paso a paso está en [DESPLIEGUE.md](DESPLIEGUE.md) y la configuración en [render.yaml](render.yaml).

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
| GET | `/api/resumen/capacidad?mes=AAAA-MM` | Capacidad de ahorro |
| GET | `/api/resumen/dashboard?mes=AAAA-MM` | Resumen de la pantalla principal |
| GET | `/api/resumen/mensual?mes=AAAA-MM` | Resumen del mes con gastos por categoría |
| GET | `/api/resumen/comparacion?mes=AAAA-MM` | Gastos del mes contra el mes anterior |
| GET / POST | `/api/metas` | Listar (con progreso y tiempo estimado) / crear metas |
| GET | `/api/metas/:id` | Detalle de una meta con sus aportes |
| POST | `/api/metas/:id/aportes` | Registrar ahorro en una meta |
| POST | `/api/metas/gasto-evitado` | Registrar un gasto evitado |
| GET | `/api/retos` | Retos disponibles, reto activo e historial |
| POST | `/api/retos/:id/iniciar` | Iniciar un reto |
| POST | `/api/retos/activo/avance` | Registrar avance del reto activo |
| POST | `/api/retos/activo/completar` | Marcar el reto como cumplido |
| POST | `/api/retos/activo/abandonar` | Abandonar el reto activo |
| GET | `/api/motivacion/racha` | Racha de ahorro |
| GET | `/api/motivacion/logros` | Logros obtenidos y pendientes |
| GET / POST | `/api/soporte` | Mis solicitudes de soporte / enviar una |

### Administración (solo rol administrador)

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | Indicadores generales |
| GET | `/api/admin/usuarios?buscar=&pagina=` | Usuarios paginados con búsqueda |
| GET | `/api/admin/usuarios/:id` | Datos generales y actividad de una cuenta |
| PATCH | `/api/admin/usuarios/:id/estado` | Activar o desactivar una cuenta |
| PATCH | `/api/admin/usuarios/:id/rol` | Asignar rol |
| GET / POST | `/api/admin/categorias` | Listar / crear categorías |
| PUT / PATCH | `/api/admin/categorias/:id` · `/:id/estado` | Editar / activar o desactivar |
| GET / POST | `/api/admin/retos` | Listar / crear retos |
| PUT / PATCH | `/api/admin/retos/:id` · `/:id/estado` | Editar / activar o desactivar |
| GET | `/api/admin/actividad?desde=&hasta=` | Actividad por día |
| GET | `/api/admin/reportes?desde=&hasta=` | Usuarios y participación en retos |
| GET / PATCH | `/api/admin/soporte/:id` | Detalle / cambiar estado con anotación |
