import { ErrorApi } from './errores.js';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

export function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function esCorreo(valor: string) {
  return CORREO.test(valor);
}

/** Máximo que cabe en las columnas NUMERIC(14,2): evita errores 500 con valores gigantes. */
export const VALOR_MAXIMO = 999_999_999_999.99;

/** Valor monetario: numérico, mayor que cero y hasta VALOR_MAXIMO (CA-08, CA-10). Acepta number o string sin letras. */
export function valorPositivo(valor: unknown): number | null {
  let numero: number;
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return null;
    numero = Math.round(valor * 100) / 100;
  } else if (typeof valor === 'string' && /^\d+(\.\d{1,2})?$/.test(valor.trim())) {
    numero = Number(valor);
  } else {
    return null;
  }
  return numero > 0 && numero <= VALOR_MAXIMO ? numero : null;
}

export function fechaValida(valor: unknown): string | null {
  if (typeof valor !== 'string' || !FECHA.test(valor)) return null;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(valor) ? valor : null;
}

export function idValido(valor: unknown): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new ErrorApi(400, 'Identificador no válido.');
  return id;
}

/** Devuelve el rango [inicio, fin) del mes YYYY-MM; por defecto el mes actual. */
export function rangoMes(valor: unknown): { mes: string; inicio: string; fin: string } {
  let mes: string;
  if (valor === undefined || valor === '') {
    mes = hoy().slice(0, 7);
  } else if (typeof valor === 'string' && MES.test(valor)) {
    mes = valor;
  } else {
    throw new ErrorApi(400, 'El mes debe tener el formato AAAA-MM.');
  }
  const [anio, numeroMes] = mes.split('-').map(Number) as [number, number];
  const siguiente = numeroMes === 12 ? `${anio + 1}-01` : `${anio}-${String(numeroMes + 1).padStart(2, '0')}`;
  return { mes, inicio: `${mes}-01`, fin: `${siguiente}-01` };
}

/** Rango [desde, hasta] inclusivo para consultas por período (HU-31, HU-33). Por defecto, los últimos 30 días. */
export function rangoFechas(desdeEntrada: unknown, hastaEntrada: unknown): { desde: string; hasta: string } {
  const hasta = hastaEntrada === undefined || hastaEntrada === '' ? hoy() : fechaValida(hastaEntrada);
  let desde: string | null;
  if (desdeEntrada === undefined || desdeEntrada === '') {
    const d = new Date(`${hasta ?? hoy()}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 29);
    desde = d.toISOString().slice(0, 10);
  } else {
    desde = fechaValida(desdeEntrada);
  }
  if (!desde || !hasta) throw new ErrorApi(400, 'Las fechas deben tener el formato AAAA-MM-DD.');
  if (desde > hasta) throw new ErrorApi(400, 'La fecha inicial no puede ser posterior a la final.');
  const dias = (Date.parse(hasta) - Date.parse(desde)) / 86_400_000;
  if (dias > 366) throw new ErrorApi(400, 'El período no puede superar un año.');
  return { desde, hasta };
}

/** Fecha local de hoy en formato AAAA-MM-DD. */
export function hoy(): string {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

/** Lanza un 400 con los errores por campo; el mensaje general es el primero salvo que se indique otro. */
export function lanzarSiHayErrores(campos: Record<string, string>, mensaje?: string) {
  if (Object.keys(campos).length > 0) {
    throw new ErrorApi(400, mensaje ?? Object.values(campos)[0]!, campos);
  }
}
