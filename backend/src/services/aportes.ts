import type pg from 'pg';
import { pool } from '../config/db.js';
import { ErrorApi } from '../utils/errores.js';
import { otorgarLogros, revisarLogrosDeAhorro, type LogroNuevo } from './logros.js';

export type TipoAporte = 'ahorro' | 'gasto_evitado' | 'reto';

export const COLUMNAS_META =
  'id, nombre, valor_objetivo, valor_ahorrado, fecha_limite, descripcion, estado, fecha_creacion';

/** Ejecuta fn dentro de una transacción y la revierte si algo falla. */
export async function enTransaccion<T>(fn: (cliente: pg.PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

export interface DatosAporte {
  idUsuario: number;
  idMeta: number;
  valor: number;
  tipo: TipoAporte;
  descripcion: string | null;
  fecha: string | null;
  idRetoUsuario?: number | null;
}

/**
 * Inserta el aporte y actualiza el valor ahorrado de la meta en la misma transacción (CA-33, CA-39).
 * Si el ahorro alcanza el objetivo, la meta pasa a cumplida (CA-34).
 */
export async function registrarAporte(cliente: pg.PoolClient, datos: DatosAporte) {
  const { rows: metas } = await cliente.query(
    `SELECT id, estado, valor_objetivo, valor_ahorrado FROM metas WHERE id = $1 AND id_usuario = $2 FOR UPDATE`,
    [datos.idMeta, datos.idUsuario],
  );
  const meta = metas[0];
  if (!meta) throw new ErrorApi(404, 'No encontramos esa meta.', { id_meta: 'Elige una de tus metas.' });
  if (meta.estado !== 'activa') {
    throw new ErrorApi(409, 'Esta meta ya está cumplida. Elige otra meta.', { id_meta: 'Esta meta ya está cumplida.' });
  }

  const { rows: aportes } = await cliente.query(
    `INSERT INTO aportes (id_meta, id_reto_usuario, valor, tipo, descripcion, fecha)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
     RETURNING id, id_meta, valor, tipo, descripcion, fecha`,
    [datos.idMeta, datos.idRetoUsuario ?? null, datos.valor, datos.tipo, datos.descripcion, datos.fecha],
  );

  const { rows: actualizadas } = await cliente.query(
    `UPDATE metas
     SET valor_ahorrado = valor_ahorrado + $1,
         estado = CASE WHEN valor_ahorrado + $1 >= valor_objetivo THEN 'cumplida' ELSE estado END
     WHERE id = $2
     RETURNING ${COLUMNAS_META}`,
    [datos.valor, datos.idMeta],
  );
  const metaActualizada = actualizadas[0];
  const cumplida = metaActualizada.estado === 'cumplida';

  const logros: LogroNuevo[] = [
    ...(cumplida ? await otorgarLogros(cliente, datos.idUsuario, ['meta_cumplida']) : []),
    ...(await revisarLogrosDeAhorro(cliente, datos.idUsuario)),
  ];

  return { aporte: aportes[0], meta: metaActualizada, cumplida, logros };
}
