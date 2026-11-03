import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { TipoIngreso } from './tipos';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

interface EstiloCategoria {
  icono: NombreIcono;
  color: string;
  fondo: string;
}

const ESTILOS: Record<string, EstiloCategoria> = {
  Vivienda: { icono: 'home', color: '#7C3AED', fondo: '#EDE9FE' },
  Alimentación: { icono: 'restaurant', color: '#EA580C', fondo: '#FFEDD5' },
  Transporte: { icono: 'bus', color: '#2563EB', fondo: '#DBEAFE' },
  Servicios: { icono: 'flash', color: '#CA8A04', fondo: '#FEF9C3' },
  Entretenimiento: { icono: 'game-controller', color: '#DB2777', fondo: '#FCE7F3' },
  Salud: { icono: 'medkit', color: '#DC2626', fondo: '#FEE2E2' },
  Educación: { icono: 'school', color: '#0891B2', fondo: '#CFFAFE' },
  Otros: { icono: 'pricetag', color: '#475569', fondo: '#E2E8F0' },
};

export function estiloCategoria(nombre: string): EstiloCategoria {
  return ESTILOS[nombre] ?? { icono: 'pricetag', color: '#475569', fondo: '#E2E8F0' };
}

const ICONOS_INGRESO: Record<TipoIngreso, NombreIcono> = {
  salario: 'briefcase',
  independiente: 'laptop',
  negocio: 'storefront',
  pension: 'umbrella',
  otro: 'cash',
};

export function iconoIngreso(tipo: TipoIngreso): NombreIcono {
  return ICONOS_INGRESO[tipo];
}
