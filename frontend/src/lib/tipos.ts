export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'usuario' | 'administrador';
  estado: 'activo' | 'inactivo';
  fecha_registro: string;
}

export interface RespuestaSesion {
  token: string;
  usuario: Usuario;
}

export type TipoIngreso = 'salario' | 'independiente' | 'negocio' | 'pension' | 'otro';
export type TipoGasto = 'fijo' | 'variable';

export interface Ingreso {
  id: number;
  valor: number;
  tipo: TipoIngreso;
  descripcion: string | null;
  fecha: string;
}

export interface Gasto {
  id: number;
  valor: number;
  tipo: TipoGasto;
  descripcion: string | null;
  fecha: string;
  id_categoria: number;
  categoria: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface ResumenDisponible {
  mes: string;
  ingresos: number;
  gastos: number;
  gastosFijos: number;
  gastosVariables: number;
  disponible: number;
  movimientos: number;
  sobregirado: boolean;
}

export interface Meta {
  id: number;
  nombre: string;
  valor_objetivo: number;
  valor_ahorrado: number;
  fecha_limite: string | null;
  descripcion: string | null;
  estado: 'activa' | 'cumplida' | 'cancelada';
  fecha_creacion: string;
}

export const TIPOS_INGRESO: { valor: TipoIngreso; etiqueta: string }[] = [
  { valor: 'salario', etiqueta: 'Salario' },
  { valor: 'independiente', etiqueta: 'Independiente' },
  { valor: 'negocio', etiqueta: 'Negocio' },
  { valor: 'pension', etiqueta: 'Pensión' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export function etiquetaTipoIngreso(tipo: TipoIngreso) {
  return TIPOS_INGRESO.find((t) => t.valor === tipo)?.etiqueta ?? 'Ingreso';
}
