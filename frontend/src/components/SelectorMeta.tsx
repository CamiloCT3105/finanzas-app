import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { moneda } from '@/lib/formato';
import type { Meta } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';
import { BarraProgreso } from './BarraProgreso';

/** Lista de metas activas para elegir a cuál se suma el ahorro. */
export function SelectorMeta({
  metas,
  valor,
  alCambiar,
  error,
}: {
  metas: Meta[];
  valor: number | null;
  alCambiar: (id: number) => void;
  error?: string | undefined;
}) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>¿A qué meta se suma?</Text>
      <View style={{ gap: espacio.sm }} accessibilityRole="radiogroup">
        {metas.map((m) => {
          const activa = m.id === valor;
          const porcentaje = Math.min(100, Math.floor((m.valor_ahorrado / m.valor_objetivo) * 100));
          return (
            <Pressable
              key={m.id}
              onPress={() => alCambiar(m.id)}
              accessibilityRole="radio"
              accessibilityLabel={m.nombre}
              accessibilityState={{ selected: activa }}
              style={[estilos.opcion, activa && estilos.opcionActiva]}
            >
              <Ionicons
                name={activa ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={activa ? colores.primario : colores.textoTenue}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={estilos.fila}>
                  <Text style={estilos.nombre} numberOfLines={1}>
                    {m.nombre}
                  </Text>
                  <Text style={estilos.porcentaje}>{porcentaje} %</Text>
                </View>
                <BarraProgreso porcentaje={porcentaje} alto={6} />
                <Text style={estilos.detalle}>
                  {moneda(m.valor_ahorrado)} de {moneda(m.valor_objetivo)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginBottom: espacio.lg },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginBottom: espacio.sm },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    padding: espacio.md,
    borderRadius: radio.md,
    borderWidth: 1.5,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  opcionActiva: { borderColor: colores.primario, backgroundColor: '#F2FBF9' },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: espacio.sm },
  nombre: { flex: 1, fontSize: 15, fontWeight: '700', color: colores.texto },
  porcentaje: { fontSize: 13, fontWeight: '800', color: colores.primario },
  detalle: { fontSize: 12, color: colores.textoSuave },
  error: { color: colores.gasto, fontSize: 13, marginTop: 6 },
});
