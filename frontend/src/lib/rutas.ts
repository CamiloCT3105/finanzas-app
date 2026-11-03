import type { Href } from 'expo-router';
import type { Movimiento } from '@/components/ItemMovimiento';

/** Abre el formulario del movimiento precargado para editarlo o eliminarlo (HU-08). */
export function rutaEdicion(m: Movimiento): Href {
  if (m.clase === 'ingreso') {
    return {
      pathname: '/ingreso',
      params: { id: m.id, valor: m.valor, tipo: m.tipo, fecha: m.fecha, descripcion: m.descripcion ?? '' },
    };
  }
  return {
    pathname: '/gasto',
    params: {
      id: m.id,
      valor: m.valor,
      tipo: m.tipo,
      fecha: m.fecha,
      descripcion: m.descripcion ?? '',
      id_categoria: m.id_categoria,
    },
  };
}
