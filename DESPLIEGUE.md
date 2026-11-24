# Despliegue de Finanzas App

Arquitectura en la nube (todo con plan gratuito):

| Pieza | Servicio | Qué es |
| --- | --- | --- |
| Base de datos | **Neon** (PostgreSQL) | Gratis y no expira |
| API (`backend/`) | **Render** – Web Service | `https://finanzas-app-api-n6hp.onrender.com/api` |
| App web (`frontend/`) | **Render** – Static Site | `https://finanzas-app-web.onrender.com` |
| App Android (APK) | **EAS Build** (Expo) | Archivo `.apk` para instalar en el celular |

> Si Render asigna otro nombre (porque `finanzas-app-api` ya está tomado), cambia la URL en
> `render.yaml` (`EXPO_PUBLIC_API_URL`) y en `frontend/eas.json`.

---

## 1. Base de datos en Neon

1. Crea una cuenta en <https://neon.tech> y un proyecto (región **AWS US East** o la más cercana).
2. En **Connection Details** copia la cadena de conexión (`postgresql://...?sslmode=require`).
   Usa la conexión **directa** (sin `-pooler` en el host) para crear las tablas.
3. Crea las tablas desde tu computador (PowerShell, en la carpeta `backend`):

   ```powershell
   $env:DATABASE_URL="postgresql://USUARIO:CLAVE@HOST/neondb?sslmode=require"; npm run db:init
   ```

   Debe terminar con `Tablas listas: ...` y `Zona horaria de la base: America/Bogota.`
   (La variable solo vive en esa ventana de PowerShell; tu `.env` local no se toca.)

## 2. API y app web en Render

1. Sube los cambios a GitHub (rama `main`).
2. En <https://render.com> → **New → Blueprint** → elige el repositorio `finanzas-app`.
   Render lee `render.yaml` y propone dos servicios: `finanzas-app-api` y `finanzas-app-web`.
3. Te pedirá **DATABASE_URL**: pega la cadena de Neon. `JWT_SECRET` se genera solo.
4. **Apply**. Espera a que los dos queden en verde (5–10 min la primera vez).
5. Comprueba la API: abre `https://finanzas-app-api-n6hp.onrender.com/api/salud` → `{"estado":"ok"}`.
6. Abre `https://finanzas-app-web.onrender.com`, crea tu cuenta y úsala.

> Plan gratuito: la API se "duerme" tras 15 min sin uso; la primera petición tarda ~50 s en despertar.
> Antes de una presentación abre `/api/salud` un minuto antes.

## 3. Crear el primer administrador

Regístrate en la app y luego, desde `backend`:

```powershell
$env:DATABASE_URL="postgresql://USUARIO:CLAVE@HOST/neondb?sslmode=require"; npm run db:admin -- tu-correo@ejemplo.com
```

Cierra sesión y vuelve a entrar para ver el panel administrativo.

## 4. APK de Android (opcional)

Desde `frontend` (pide iniciar sesión con una cuenta gratuita de Expo):

```powershell
npx eas-cli@latest build -p android --profile preview
```

La primera vez pregunta si crear el proyecto en EAS y la llave de firma: responde que sí.
Al terminar (10–20 min en cola gratuita) da un enlace para descargar el `.apk`.

---

## Variables de entorno de la API

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí (nube) | Cadena de conexión de PostgreSQL. Con `sslmode=require` usa SSL. |
| `JWT_SECRET` | Sí | Mínimo 32 caracteres aleatorios en producción. |
| `NODE_ENV` | Recomendada | `production` |
| `TZ` | No | Zona horaria, por defecto `America/Bogota`. |
| `JWT_EXPIRES_IN` | No | Duración de la sesión, por defecto `7d`. |
| `CORS_ORIGIN` | No | Páginas web permitidas, separadas por coma. Sin ella se permite cualquiera. |
| `DB_SSL` | No | `true`/`false` para forzar o quitar SSL. |

## Seguridad incluida

- `helmet` (cabeceras de seguridad) y sin cabecera `X-Powered-By`.
- Límite de intentos: 10 logins fallidos por IP cada 15 min, 20 registros por IP cada 15 min y
  1000 peticiones por IP cada 15 min en toda la API.
- Las cuentas desactivadas pierden el acceso de inmediato (el estado se revisa en cada petición).
