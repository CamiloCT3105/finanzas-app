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

// ---------- Sprint 2 ----------

export interface Logro {
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
}

export interface LogroUsuario extends Logro {
  condicion: string;
  obtenido: boolean;
  fecha: string | null;
}

export interface Estimacion {
  meses: number | null;
  fechaEstimada: string | null;
  capacidadMensual: number;
  aviso: string | null;
}

export interface MetaConProgreso extends Meta {
  restante: number;
  porcentaje: number;
  estimacion: Estimacion;
}

export type TipoAporte = 'ahorro' | 'gasto_evitado' | 'reto';

export interface Aporte {
  id: number;
  valor: number;
  tipo: TipoAporte;
  descripcion: string | null;
  fecha: string;
}

export interface MetaDetalle extends MetaConProgreso {
  aportes: Aporte[];
}

export interface ResultadoAporte {
  aporte: Aporte;
  meta: Meta;
  cumplida: boolean;
  logros: Logro[];
}

export interface Capacidad {
  ingresos: number;
  gastos: number;
  valor: number;
  porcentaje: number | null;
  mensaje: string | null;
}

export interface MetaAvance extends Meta {
  porcentaje: number;
  restante: number;
  aportado_mes: number;
}

export interface Dashboard extends ResumenDisponible {
  ahorro: number;
  capacidad: Capacidad;
  racha: number;
  metas: MetaAvance[];
  totalMetas: number;
  vacio: boolean;
}

export interface GastoCategoria {
  id: number;
  categoria: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface ResumenMensual {
  mes: string;
  ingresos: number;
  gastos: number;
  gastosFijos: number;
  gastosVariables: number;
  disponible: number;
  ahorro: number;
  capacidad: Capacidad;
  categorias: GastoCategoria[];
  metas: MetaAvance[];
  sinDatos: boolean;
}

export interface Comparacion {
  mes: string;
  mesAnterior: string;
  gastosActual: number;
  gastosAnterior: number;
  sinAnterior: boolean;
  mensaje?: string;
  diferencia?: number;
  porcentaje?: number;
  tendencia?: 'aumento' | 'disminucion' | 'igual';
}

export interface Reto {
  id: number;
  nombre: string;
  descripcion: string;
  objetivo: number;
  duracion_dias: number;
  condiciones: string | null;
}

export type EstadoRetoUsuario = 'activo' | 'cumplido' | 'no_cumplido' | 'abandonado';

export interface RetoUsuario {
  id: number;
  id_reto: number;
  nombre: string;
  descripcion: string;
  objetivo: number;
  duracion_dias: number;
  condiciones: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoRetoUsuario;
  fecha_cumplimiento: string | null;
  ahorrado: number;
  dias_restantes: number;
}

export interface RetosUsuario {
  disponibles: Reto[];
  activo: RetoUsuario | null;
  historial: RetoUsuario[];
}

export interface Racha {
  actual: number;
  mejor: number;
  ahorroHoy: boolean;
  ultimosDias: { fecha: string; ahorro: boolean }[];
}

export type EstadoSoporte = 'pendiente' | 'en_proceso' | 'resuelta';

export interface SolicitudSoporte {
  id: number;
  asunto: string;
  descripcion: string;
  estado: EstadoSoporte;
  anotacion: string | null;
  fecha: string;
  fecha_actualizacion: string | null;
}

export const ESTADOS_SOPORTE: Record<EstadoSoporte, { etiqueta: string; color: string; fondo: string }> = {
  pendiente: { etiqueta: 'Pendiente', color: '#B45309', fondo: '#FEF3C7' },
  en_proceso: { etiqueta: 'En proceso', color: '#1D4ED8', fondo: '#DBEAFE' },
  resuelta: { etiqueta: 'Resuelta', color: '#15803D', fondo: '#DCFCE7' },
};

export const ETIQUETA_APORTE: Record<TipoAporte, string> = {
  ahorro: 'Ahorro',
  gasto_evitado: 'Gasto evitado',
  reto: 'Avance de reto',
};

// ---------- Administración ----------

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  correo: string;
  fecha_registro: string;
  estado: 'activo' | 'inactivo';
  rol: 'usuario' | 'administrador';
}

export interface PaginaUsuarios {
  datos: UsuarioAdmin[];
  total: number;
  pagina: number;
  paginas: number;
}

export interface DetalleUsuarioAdmin extends UsuarioAdmin {
  ultimo_acceso: string | null;
  dias_activo: number;
  dias_activo_30: number;
  retos_iniciados: number;
  retos_cumplidos: number;
  logros: number;
  solicitudes: number;
}

export interface DashboardAdmin {
  total_usuarios: number;
  activos: number;
  inactivos: number;
  administradores: number;
  retos_disponibles: number;
  retos_en_curso: number;
  categorias_activas: number;
  solicitudes_abiertas: number;
  activos_7_dias: number;
}

export interface CategoriaAdmin {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: 'activo' | 'inactivo';
  gastos_asociados: number;
}

export interface RetoAdmin extends Reto {
  estado: 'activo' | 'inactivo';
  fecha_creacion: string;
  participantes: number;
  cumplidos: number;
}

export interface DiaActividad {
  fecha: string;
  usuarios_activos: number;
  registros: number;
  retos_iniciados: number;
  retos_cumplidos: number;
}

export interface Actividad {
  desde: string;
  hasta: string;
  dias: DiaActividad[];
  totales: Omit<DiaActividad, 'fecha'>;
}

export interface Reporte {
  desde: string;
  hasta: string;
  registrados: number;
  activos: number;
  participantes_retos: number;
  participacion: {
    id: number;
    nombre: string;
    iniciados: number;
    cumplidos: number;
    no_cumplidos: number;
    en_curso: number;
    abandonados: number;
    tasa_cumplimiento: number;
  }[];
  sinDatos: boolean;
}

export interface SolicitudAdmin {
  id: number;
  asunto: string;
  estado: EstadoSoporte;
  fecha: string;
  fecha_actualizacion: string | null;
  usuario: string;
  correo: string;
}

export interface SolicitudDetalleAdmin extends SolicitudAdmin {
  descripcion: string;
  anotacion: string | null;
  responsable: string | null;
  seguimiento: { id: number; estado: EstadoSoporte; anotacion: string | null; fecha: string; responsable: string | null }[];
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
