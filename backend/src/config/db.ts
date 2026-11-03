import pg from 'pg';
import { env } from './env.js';

// NUMERIC llega como string desde pg; lo convertimos a number para la API.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (valor) => Number(valor));
// DATE se devuelve tal cual (YYYY-MM-DD) para evitar corrimientos por zona horaria.
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor);

export const pool = new pg.Pool(env.db);
