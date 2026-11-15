import { pool } from '../config/db.js';
import { hoy, rangoMes } from '../utils/validaciones.js';

export interface TotalesMes {
  ingresos: number;
  gastosFijos: number;
  gastosVariables: number;
  gastos: number;
  ahorro: number;
  movimientos: number;
}

/** Totales de un mes con consultas SUM sobre ingresos, gastos y aportes del usuario. */
export async function totalesMes(idUsuario: number, inicio: string, fin: string): Promise<TotalesMes> {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COALESCE(SUM(valor), 0) FROM ingresos
         WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3) AS ingresos,
       (SELECT COALESCE(SUM(valor), 0) FROM gastos
         WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3 AND tipo = 'fijo') AS gastos_fijos,
       (SELECT COALESCE(SUM(valor), 0) FROM gastos
         WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3 AND tipo = 'variable') AS gastos_variables,
       (SELECT COALESCE(SUM(a.valor), 0) FROM aportes a JOIN metas m ON m.id = a.id_meta
         WHERE m.id_usuario = $1 AND a.fecha >= $2 AND a.fecha < $3) AS ahorro,
       (SELECT COUNT(*) FROM ingresos WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3)::int
       + (SELECT COUNT(*) FROM gastos WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3)::int AS movimientos`,
    [idUsuario, inicio, fin],
  );
  const f = rows[0];
  return {
    ingresos: f.ingresos,
    gastosFijos: f.gastos_fijos,
    gastosVariables: f.gastos_variables,
    gastos: f.gastos_fijos + f.gastos_variables,
    ahorro: f.ahorro,
    movimientos: f.movimientos,
  };
}

export interface Capacidad {
  ingresos: number;
  gastos: number;
  valor: number;
  porcentaje: number | null;
  mensaje: string | null;
}

/**
 * HU-10: capacidad de ahorro = (ingresos − gastos) ÷ ingresos × 100 (CA-19).
 * Sin ingresos no se divide y se devuelve un mensaje (CA-20).
 */
export function calcularCapacidad(ingresos: number, gastos: number): Capacidad {
  if (ingresos <= 0) {
    return { ingresos, gastos, valor: 0, porcentaje: null, mensaje: 'Registra tu ingreso del mes para calcular tu capacidad de ahorro.' };
  }
  const valor = ingresos - gastos;
  const porcentaje = Math.round((valor / ingresos) * 1000) / 10;
  const mensaje =
    valor < 0
      ? 'Este mes gastaste más de lo que ingresaste, así que no tienes capacidad de ahorro.'
      : porcentaje < 10
        ? 'Tu capacidad de ahorro es baja. Intenta reducir tus gastos variables.'
        : porcentaje >= 20
          ? '¡Muy bien! Estás ahorrando al menos el 20 % de tu ingreso.'
          : 'Vas bien. Lo recomendado es ahorrar al menos el 20 % de tu ingreso.';
  return { ingresos, gastos, valor, porcentaje, mensaje };
}

export async function capacidadDelMes(idUsuario: number, mes?: string): Promise<Capacidad & { mes: string }> {
  const rango = rangoMes(mes);
  const totales = await totalesMes(idUsuario, rango.inicio, rango.fin);
  return { mes: rango.mes, ...calcularCapacidad(totales.ingresos, totales.gastos) };
}

/** Suma n meses a una fecha AAAA-MM-DD conservando el día cuando existe. */
export function sumarMeses(fecha: string, meses: number): string {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  const destino = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(d, ultimoDia));
  return destino.toISOString().slice(0, 10);
}

export interface Estimacion {
  meses: number | null;
  fechaEstimada: string | null;
  capacidadMensual: number;
  aviso: string | null;
}

/**
 * HU-16: meses = (valor objetivo − valor ahorrado) ÷ capacidad mensual, redondeado hacia arriba (CA-31).
 * Si la capacidad es cero o negativa no se divide y se devuelve un aviso (CA-32).
 */
export function estimarMeta(objetivo: number, ahorrado: number, capacidadMensual: number): Estimacion {
  const restante = Math.max(0, objetivo - ahorrado);
  if (restante === 0) return { meses: 0, fechaEstimada: null, capacidadMensual, aviso: null };
  if (capacidadMensual <= 0) {
    return {
      meses: null,
      fechaEstimada: null,
      capacidadMensual,
      aviso: 'No se puede estimar el tiempo: tu capacidad de ahorro de este mes es cero o negativa.',
    };
  }
  const meses = Math.ceil(restante / capacidadMensual);
  return { meses, fechaEstimada: sumarMeses(hoy(), meses), capacidadMensual, aviso: null };
}
