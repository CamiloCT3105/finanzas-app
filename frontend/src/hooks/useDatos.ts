import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mensajeError } from '@/lib/api';

/**
 * Carga datos cada vez que la pantalla recibe el foco (por ejemplo, al volver de un formulario),
 * así el dinero disponible y las listas siempre se ven recalculados (CA-15).
 * `clave` identifica la consulta (por ejemplo, el mes): si cambia, se vuelve a cargar.
 */
export function useDatos<T>(cargar: () => Promise<T>, clave = '') {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const solicitud = useRef(0);
  const cargarActual = useRef(cargar);

  useEffect(() => {
    cargarActual.current = cargar;
  });

  const recargar = useCallback(
    async (manual = false) => {
      const actual = ++solicitud.current;
      if (manual) setRefrescando(true);
      try {
        const resultado = await cargarActual.current();
        if (actual === solicitud.current) {
          setDatos(resultado);
          setError('');
        }
      } catch (e) {
        if (actual === solicitud.current) setError(mensajeError(e));
      } finally {
        if (actual === solicitud.current) {
          setCargando(false);
          setRefrescando(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clave],
  );

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  return { datos, error, cargando, refrescando, recargar: () => recargar(true) };
}
