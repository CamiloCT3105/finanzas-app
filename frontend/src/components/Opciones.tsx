import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, espacio, radio } from '@/theme';

interface Opcion<T extends string> {
  valor: T;
  etiqueta: string;
  icono?: ComponentProps<typeof Ionicons>['name'];
}

/** Chips de selección única (tipo de ingreso, filtros). */
export function Chips<T extends string>({
  opciones,
  valor,
  alCambiar,
}: {
  opciones: Opcion<T>[];
  valor: T | null;
  alCambiar: (valor: T) => void;
}) {
  return (
    <View style={estilos.chips} accessibilityRole="radiogroup">
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        return (
          <Pressable
            key={opcion.valor}
            onPress={() => alCambiar(opcion.valor)}
            accessibilityRole="radio"
            accessibilityLabel={opcion.etiqueta}
            accessibilityState={{ selected: activo }}
            style={[estilos.chip, activo && estilos.chipActivo]}
          >
            {opcion.icono ? (
              <Ionicons name={opcion.icono} size={16} color={activo ? colores.blanco : colores.textoSuave} />
            ) : null}
            <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{opcion.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Control segmentado (Fijo / Variable, filtros de movimientos). */
export function Segmentado<T extends string>({
  opciones,
  valor,
  alCambiar,
}: {
  opciones: Opcion<T>[];
  valor: T;
  alCambiar: (valor: T) => void;
}) {
  return (
    <View style={estilos.segmentado} accessibilityRole="tablist">
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        return (
          <Pressable
            key={opcion.valor}
            onPress={() => alCambiar(opcion.valor)}
            accessibilityRole="tab"
            accessibilityLabel={opcion.etiqueta}
            accessibilityState={{ selected: activo }}
            style={[estilos.segmento, activo && estilos.segmentoActivo]}
          >
            {opcion.icono ? (
              <Ionicons name={opcion.icono} size={16} color={activo ? colores.primario : colores.textoSuave} />
            ) : null}
            <Text numberOfLines={1} style={[estilos.segmentoTexto, activo && estilos.segmentoTextoActivo]}>
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: espacio.md,
    paddingVertical: 10,
    borderRadius: radio.total,
    borderWidth: 1.5,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipTexto: { fontSize: 14, fontWeight: '600', color: colores.textoSuave },
  chipTextoActivo: { color: colores.blanco },
  segmentado: {
    flexDirection: 'row',
    backgroundColor: '#E7EBF1',
    borderRadius: radio.md,
    padding: 4,
    gap: 4,
  },
  segmento: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radio.sm,
  },
  segmentoActivo: { backgroundColor: colores.tarjeta },
  segmentoTexto: { fontSize: 14, fontWeight: '600', color: colores.textoSuave },
  segmentoTextoActivo: { color: colores.primario },
});
