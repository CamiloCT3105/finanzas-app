import 'dotenv/config';
import type { PoolConfig } from 'pg';

// Zona horaria de la app: "hoy", las rachas y los retos se calculan con la fecha de Colombia
// aunque el servidor esté en UTC. Se fija antes de crear cualquier fecha.
const ZONA_HORARIA = process.env.TZ || 'America/Bogota';
if (!/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(ZONA_HORARIA)) {
  throw new Error(`La variable TZ no es una zona horaria válida: ${ZONA_HORARIA}`);
}
process.env.TZ = ZONA_HORARIA;

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa el archivo .env (puedes copiar .env.example).`);
  }
  return valor;
}

/**
 * Conexión a PostgreSQL. En la nube (Neon, Render, Supabase...) basta con DATABASE_URL, que trae
 * usuario, contraseña, host y base; en local se siguen usando las variables DB_*.
 * DB_SSL=true activa SSL (se activa solo si la URL trae sslmode=require).
 */
function configuracionDb(): PoolConfig & { database: string } {
  const url = process.env.DATABASE_URL;
  if (url) {
    const ssl = process.env.DB_SSL ? process.env.DB_SSL === 'true' : /sslmode=(require|verify-full|verify-ca)/.test(url);
    // pg trata sslmode de la URL por su cuenta; se quita para que mande la opción ssl de abajo.
    const limpia = new URL(url);
    limpia.searchParams.delete('sslmode');
    limpia.searchParams.delete('channel_binding');
    return {
      connectionString: limpia.toString(),
      database: decodeURIComponent(limpia.pathname.replace(/^\//, '')),
      ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: requerida('DB_PASSWORD'),
    database: process.env.DB_NAME ?? 'finanzas_app',
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

export const env = {
  produccion: process.env.NODE_ENV === 'production',
  puerto: Number(process.env.PORT ?? 3000),
  zonaHoraria: ZONA_HORARIA,
  usaDatabaseUrl: !!process.env.DATABASE_URL,
  db: configuracionDb(),
  jwt: {
    secreto: requerida('JWT_SECRET'),
    expiraEn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
};

if (env.produccion && env.jwt.secreto.length < 32) {
  throw new Error('En producción JWT_SECRET debe tener al menos 32 caracteres aleatorios.');
}
