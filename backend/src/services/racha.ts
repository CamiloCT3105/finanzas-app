import type pg from 'pg';
import { pool } from '../config/db.js';
import { hoy } from '../utils/validaciones.js';

function diaAnterior(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface Racha {
  actual: number;
  mejor: number;
  ahorroHoy: boolean;
  ultimosDias: { fecha: string; ahorro: boolean }[];
}

/**
 * HU-22: cuenta los días consecutivos con al menos un aporte (ahorro, gasto evitado o avance de reto).
 * Si hoy todavía no hay aporte, la racha sigue viva contando hasta ayer (CA-43);
 * si pasó un día completo sin aportes, vuelve a cero (CA-44).
 */
export async function calcularRacha(idUsuario: number, db: Pick<pg.Pool, 'query'> | pg.PoolClient = pool): Promise<Racha> {
  const { rows } = await db.query(
    `SELECT DISTINCT a.fecha FROM aportes a JOIN metas m ON m.id = a.id_meta
     WHERE m.id_usuario = $1 AND a.fecha <= CURRENT_DATE
     ORDER BY a.fecha DESC`,
    [idUsuario],
  );
  const dias = new Set<string>(rows.map((r) => r.fecha as string));
  const hoyIso = hoy();
  const ahorroHoy = dias.has(hoyIso);

  let actual = 0;
  let cursor = ahorroHoy ? hoyIso : diaAnterior(hoyIso);
  while (dias.has(cursor)) {
    actual += 1;
    cursor = diaAnterior(cursor);
  }

  // Mejor racha histórica
  const ordenados = [...dias].sort();
  let mejor = 0;
  let seguidos = 0;
  let previo: string | null = null;
  for (const d of ordenados) {
    seguidos = previo !== null && diaAnterior(d) === previo ? seguidos + 1 : 1;
    mejor = Math.max(mejor, seguidos);
    previo = d;
  }

  const ultimosDias: Racha['ultimosDias'] = [];
  let dia = hoyIso;
  for (let i = 0; i < 7; i++) {
    ultimosDias.unshift({ fecha: dia, ahorro: dias.has(dia) });
    dia = diaAnterior(dia);
  }

  return { actual, mejor: Math.max(mejor, actual), ahorroHoy, ultimosDias };
}
