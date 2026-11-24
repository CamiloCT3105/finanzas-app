import pg from 'pg';
import { env } from './env.js';

// NUMERIC llega como string desde pg; lo convertimos a number para la API.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (valor) => Number(valor));
// DATE se devuelve tal cual (YYYY-MM-DD) para evitar corrimientos por zona horaria.
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor);

export const pool = new pg.Pool({ ...env.db, max: 10, idleTimeoutMillis: 30_000 });

// CURRENT_DATE y NOW() deben usar la misma zona horaria que Node (ver env.ts).
pool.on('connect', (cliente) => {
  cliente.query(`SET TIME ZONE '${env.zonaHoraria}'`).catch((error) => {
    console.error('No se pudo fijar la zona horaria de la sesión:', error.message);
  });
});

// Un cliente inactivo que pierde la conexión (p. ej. la base en la nube se suspende) no debe tumbar la API.
pool.on('error', (error) => {
  console.error('Error en una conexión inactiva de PostgreSQL:', error.message);
});
