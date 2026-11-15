import { mesYAnio } from './formato';
import type { MetaConProgreso } from './tipos';

/** Texto del tiempo estimado (HU-16): "≈ 10 meses · noviembre de 2027" o el aviso si no se puede calcular (CA-32). */
export function textoEstimacion(meta: MetaConProgreso): { texto: string; aviso: boolean } {
  if (meta.estado === 'cumplida') return { texto: '¡Meta cumplida!', aviso: false };
  const e = meta.estimacion;
  if (e.meses === null) return { texto: 'Sin estimación: tu capacidad de ahorro es cero o negativa', aviso: true };
  return {
    texto: `≈ ${e.meses} ${e.meses === 1 ? 'mes' : 'meses'}${e.fechaEstimada ? ` · ${mesYAnio(e.fechaEstimada)}` : ''}`,
    aviso: false,
  };
}
