import type { Celebracion } from '@/context/celebraciones';
import type { Logro, Meta } from './tipos';

/** CA-34: felicitación cuando un aporte completa la meta, seguida de los logros nuevos (CA-45). */
export function celebracionesDeAporte(resultado: { cumplida: boolean; meta: Meta; logros: Logro[] }): Celebracion[] {
  const items: Celebracion[] = [];
  if (resultado.cumplida) {
    items.push({
      titulo: '¡Meta cumplida! 🎉',
      mensaje: `Completaste "${resultado.meta.nombre}". Tu esfuerzo dio resultado: ¡felicitaciones!`,
      icono: 'trophy',
      etiqueta: 'Felicitaciones',
    });
  }
  for (const l of resultado.logros) {
    items.push({ titulo: l.nombre, mensaje: l.descripcion, icono: l.icono as Celebracion['icono'], etiqueta: '¡Logro desbloqueado!' });
  }
  return items;
}
