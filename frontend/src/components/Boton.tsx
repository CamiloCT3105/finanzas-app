import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colores, espacio, radio } from '@/theme';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icono?: ComponentProps<typeof Ionicons>['name'];
  cargando?: boolean;
  deshabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}

const VARIANTES: Record<Variante, { fondo: string; texto: string; borde: string }> = {
  primario: { fondo: colores.primario, texto: colores.blanco, borde: colores.primario },
  secundario: { fondo: colores.tarjeta, texto: colores.primario, borde: colores.borde },
  peligro: { fondo: colores.gastoSuave, texto: colores.gasto, borde: colores.gastoSuave },
  fantasma: { fondo: 'transparent', texto: colores.primario, borde: 'transparent' },
};

export function Boton({ titulo, onPress, variante = 'primario', icono, cargando, deshabilitado, estilo }: Props) {
  const v = VARIANTES[variante];
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: v.fondo, borderColor: v.borde },
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        inactivo && { opacity: 0.6 },
        estilo,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <View style={estilos.fila}>
          {icono ? <Ionicons name={icono} size={18} color={v.texto} /> : null}
          <Text style={[estilos.texto, { color: v.texto }]}>{titulo}</Text>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: 52,
    borderRadius: radio.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacio.lg,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  texto: { fontSize: 16, fontWeight: '700' },
});
