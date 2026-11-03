import { Platform } from 'react-native';

export const colores = {
  primario: '#0F766E',
  primarioOscuro: '#0B3B4F',
  primarioSuave: '#CCFBF1',
  acento: '#14B8A6',

  fondo: '#F3F5F9',
  tarjeta: '#FFFFFF',
  borde: '#E3E8EF',
  texto: '#0F172A',
  textoSuave: '#64748B',
  textoTenue: '#94A3B8',
  blanco: '#FFFFFF',

  ingreso: '#16A34A',
  ingresoSuave: '#DCFCE7',
  gasto: '#E11D48',
  gastoSuave: '#FFE4E6',
  advertencia: '#D97706',
  advertenciaSuave: '#FEF3C7',
  info: '#2563EB',
  infoSuave: '#DBEAFE',
};

export const degradadoSaldo = ['#0F766E', '#0B3B4F'] as const;
export const degradadoNegativo = ['#BE123C', '#4C0519'] as const;

export const espacio = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radio = { sm: 8, md: 12, lg: 16, xl: 24, total: 999 };

export const sombra = Platform.select({
  web: { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)' },
  default: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
}) as object;

/** Ancho máximo del contenido para que en tablet y web no se estire de borde a borde. */
export const ANCHO_MAXIMO = 640;
