import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, use, useCallback, useMemo, useState, type ComponentProps, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Boton } from '@/components/Boton';
import type { Logro } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

export interface Celebracion {
  titulo: string;
  mensaje: string;
  icono: NombreIcono;
  etiqueta?: string;
}

interface ContextoCelebraciones {
  celebrar: (items: Celebracion[]) => void;
  /** HU-23 (CA-45): notificación de cada logro nuevo. */
  celebrarLogros: (logros: Logro[] | undefined) => void;
}

const Contexto = createContext<ContextoCelebraciones | null>(null);

export function useCelebraciones() {
  const valor = use(Contexto);
  if (!valor) throw new Error('useCelebraciones debe usarse dentro de <ProveedorCelebraciones />');
  return valor;
}

export function ProveedorCelebraciones({ children }: PropsWithChildren) {
  const [cola, setCola] = useState<Celebracion[]>([]);

  const celebrar = useCallback((items: Celebracion[]) => {
    if (items.length) setCola((actual) => [...actual, ...items]);
  }, []);

  const celebrarLogros = useCallback(
    (logros: Logro[] | undefined) =>
      celebrar(
        (logros ?? []).map((l) => ({
          titulo: l.nombre,
          mensaje: l.descripcion,
          icono: l.icono as NombreIcono,
          etiqueta: '¡Logro desbloqueado!',
        })),
      ),
    [celebrar],
  );

  const valor = useMemo(() => ({ celebrar, celebrarLogros }), [celebrar, celebrarLogros]);
  const actual = cola[0];
  const cerrar = () => setCola((c) => c.slice(1));

  return (
    <Contexto.Provider value={valor}>
      {children}
      <Modal visible={!!actual} transparent animationType="fade" onRequestClose={cerrar}>
        <Pressable style={estilos.fondo} onPress={cerrar}>
          <Pressable style={estilos.caja} onPress={() => {}} accessibilityRole="alert">
            {actual ? (
              <>
                <View style={estilos.halo}>
                  <View style={estilos.icono}>
                    <Ionicons name={actual.icono} size={40} color={colores.blanco} />
                  </View>
                </View>
                {actual.etiqueta ? <Text style={estilos.etiqueta}>{actual.etiqueta}</Text> : null}
                <Text style={estilos.titulo}>{actual.titulo}</Text>
                <Text style={estilos.mensaje}>{actual.mensaje}</Text>
                <Boton titulo={cola.length > 1 ? 'Siguiente' : '¡Genial!'} onPress={cerrar} estilo={{ alignSelf: 'stretch' }} />
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Contexto.Provider>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacio.xl,
  },
  caja: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colores.tarjeta,
    borderRadius: radio.xl,
    padding: espacio.xl,
    alignItems: 'center',
  },
  halo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacio.lg,
  },
  icono: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiqueta: { fontSize: 13, fontWeight: '800', color: '#B45309', textTransform: 'uppercase', letterSpacing: 1 },
  titulo: { fontSize: 22, fontWeight: '800', color: colores.texto, textAlign: 'center', marginTop: espacio.xs },
  mensaje: { fontSize: 15, color: colores.textoSuave, textAlign: 'center', lineHeight: 21, marginVertical: espacio.lg },
});
