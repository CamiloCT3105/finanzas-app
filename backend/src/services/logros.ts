import type pg from 'pg';
import { pool } from '../config/db.js';
import { calcularRacha } from './racha.js';

export interface LogroNuevo {
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
}

type Consultable = Pick<pg.Pool, 'query'> | pg.PoolClient;

/**
 * HU-23: otorga los logros indicados. La llave primaria (id_usuario, id_logro) impide repetirlos (CA-46),
 * así que solo se devuelven los que se otorgaron en esta llamada, para mostrar la notificación (CA-45).
 */
export async function otorgarLogros(db: Consultable, idUsuario: number, codigos: string[]): Promise<LogroNuevo[]> {
  if (codigos.length === 0) return [];
  const { rows } = await db.query(
    `WITH nuevos AS (
       INSERT INTO logros_usuario (id_usuario, id_logro)
       SELECT $1, id FROM logros WHERE codigo = ANY($2::text[])
       ON CONFLICT DO NOTHING
       RETURNING id_logro
     )
     SELECT l.codigo, l.nombre, l.descripcion, l.icono FROM logros l JOIN nuevos n ON n.id_logro = l.id`,
    [idUsuario, codigos],
  );
  return rows;
}

/** Logros que dependen del ahorro acumulado: primer aporte, $100.000 en total y racha de 7 días. */
export async function revisarLogrosDeAhorro(db: Consultable, idUsuario: number): Promise<LogroNuevo[]> {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS aportes, COALESCE(SUM(a.valor), 0) AS total
     FROM aportes a JOIN metas m ON m.id = a.id_meta WHERE m.id_usuario = $1`,
    [idUsuario],
  );
  const codigos: string[] = [];
  if (rows[0].aportes > 0) codigos.push('primer_ahorro');
  if (rows[0].total >= 100_000) codigos.push('ahorro_100k');
  const racha = await calcularRacha(idUsuario, db);
  if (racha.actual >= 7) codigos.push('racha_7');
  return otorgarLogros(db, idUsuario, codigos);
}

export async function listarLogros(idUsuario: number) {
  const { rows } = await pool.query(
    `SELECT l.codigo, l.nombre, l.descripcion, l.condicion, l.icono, lu.fecha
     FROM logros l
     LEFT JOIN logros_usuario lu ON lu.id_logro = l.id AND lu.id_usuario = $1
     ORDER BY lu.fecha IS NULL, lu.fecha, l.id`,
    [idUsuario],
  );
  return rows.map((r) => ({ ...r, obtenido: r.fecha !== null }));
}
