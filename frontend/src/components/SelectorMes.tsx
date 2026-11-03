import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { mesActual, moverMes, nombreMes } from '@/lib/formato';
import { colores, espacio, radio } from '@/theme';

export function SelectorMes({
  mes,
  alCambiar,
  claro,
}: {
  mes: string;
  alCambiar: (mes: string) => void;
  claro?: boolean;
}) {
  const esActual = mes === mesActual();
  const colorTexto = claro ? colores.blanco : colores.texto;
  const colorIcono = claro ? colores.blanco : colores.textoSuave;
  return (
    <View style={[estilos.contenedor, claro && estilos.contenedorClaro]}>
      <Pressable
        onPress={() => alCambiar(moverMes(mes, -1))}
        hitSlop={8}
        accessibilityLabel="Mes anterior"
        style={estilos.flecha}
      >
        <Ionicons name="chevron-back" size={18} color={colorIcono} />
      </Pressable>
      <Text style={[estilos.texto, { color: colorTexto }]}>{nombreMes(mes)}</Text>
      <Pressable
        onPress={() => alCambiar(moverMes(mes, 1))}
        disabled={esActual}
        hitSlop={8}
        accessibilityLabel="Mes siguiente"
        style={[estilos.flecha, esActual && { opacity: 0.3 }]}
      >
        <Ionicons name="chevron-forward" size={18} color={colorIcono} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colores.tarjeta,
    borderRadius: radio.total,
    borderWidth: 1,
    borderColor: colores.borde,
    paddingHorizontal: 4,
  },
  contenedorClaro: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.2)' },
  flecha: { padding: espacio.sm },
  texto: { fontSize: 14, fontWeight: '700', minWidth: 120, textAlign: 'center' },
});
