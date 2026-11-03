const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** $1.500.000 — formato peso colombiano sin depender de Intl (no siempre disponible en Hermes). */
export function moneda(valor: number, conSigno = false): string {
  const negativo = valor < 0;
  const absoluto = Math.abs(valor);
  const entero = Math.floor(absoluto);
  const decimales = Math.round((absoluto - entero) * 100);
  const miles = String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const texto = `$${miles}${decimales ? `,${String(decimales).padStart(2, '0')}` : ''}`;
  if (negativo) return `-${texto}`;
  return conSigno && valor > 0 ? `+${texto}` : texto;
}

/**
 * Convierte lo que escribe el usuario en un número. Acepta "1500000", "1.500.000" y "1500000,50".
 * Devuelve null si hay letras, está vacío o no es un número válido (CA-08).
 */
export function leerValor(texto: string): number | null {
  const limpio = texto.trim().replace(/\s/g, '').replace(/^\$/, '');
  let normalizado: string;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(limpio)) {
    normalizado = limpio.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+([.,]\d{1,2})?$/.test(limpio)) {
    normalizado = limpio.replace(',', '.');
  } else {
    return null;
  }
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

/** Texto para precargar un formulario a partir de un valor guardado. */
export function valorATexto(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace('.', ',');
}

export function hoyISO(): string {
  return fechaISO(new Date());
}

export function fechaISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

export function mesActual(): string {
  return hoyISO().slice(0, 7);
}

export function moverMes(mes: string, delta: number): string {
  const [anio, numero] = mes.split('-').map(Number) as [number, number];
  const fecha = new Date(anio, numero - 1 + delta, 1);
  return fechaISO(fecha).slice(0, 7);
}

export function nombreMes(mes: string): string {
  const [anio, numero] = mes.split('-').map(Number) as [number, number];
  const nombre = MESES[numero - 1] ?? '';
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
}

export function nombreMesSolo(indice: number): string {
  const nombre = MESES[indice] ?? '';
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)}`;
}

/** "12 oct 2026" */
export function fechaCorta(iso: string): string {
  // Las fechas con hora (ej. fecha_registro) llegan en UTC: se pasan a la fecha local del celular.
  const local = iso.length > 10 ? fechaISO(new Date(iso)) : iso;
  const [anio, mes, dia] = local.split('-').map(Number) as [number, number, number];
  return `${dia} ${MESES_CORTOS[mes - 1]} ${anio}`;
}

/** "Hoy", "Ayer" o "Lunes 12 de octubre" para agrupar movimientos. */
export function fechaTitulo(iso: string): string {
  const hoy = hoyISO();
  const ayer = fechaISO(new Date(Date.now() - 86_400_000));
  if (iso === hoy) return 'Hoy';
  if (iso === ayer) return 'Ayer';
  const [anio, mes, dia] = iso.split('-').map(Number) as [number, number, number];
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diaSemana = dias[new Date(anio, mes - 1, dia).getDay()];
  return `${diaSemana} ${dia} de ${MESES[mes - 1]}`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}
