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

/** Valor monetario: numérico y mayor que cero (CA-08, CA-10). Acepta number o string sin letras. */
export function valorPositivo(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) && valor > 0 ? valor : null;
  if (typeof valor !== 'string' || !/^\d+(\.\d{1,2})?$/.test(valor.trim())) return null;
  const numero = Number(valor);
  return numero > 0 ? numero : null;
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
