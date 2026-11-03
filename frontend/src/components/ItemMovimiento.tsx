import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { estiloCategoria, iconoIngreso } from '@/lib/categorias';
import { fechaCorta, moneda } from '@/lib/formato';
import { etiquetaTipoIngreso, type Gasto, type Ingreso } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

export type Movimiento = ({ clase: 'ingreso' } & Ingreso) | ({ clase: 'gasto' } & Gasto);

export function ItemMovimiento({
  movimiento,
  onPress,
  mostrarFecha,
}: {
  movimiento: Movimiento;
  onPress?: () => void;
  mostrarFecha?: boolean;
}) {
  const esIngreso = movimiento.clase === 'ingreso';
  const estilo = esIngreso
    ? { icono: iconoIngreso(movimiento.tipo), color: colores.ingreso, fondo: colores.ingresoSuave }
    : estiloCategoria(movimiento.categoria);
  const titulo = movimiento.descripcion || (esIngreso ? etiquetaTipoIngreso(movimiento.tipo) : movimiento.categoria);
  const detalle = esIngreso
    ? etiquetaTipoIngreso(movimiento.tipo)
    : `${movimiento.categoria} · ${movimiento.tipo === 'fijo' ? 'Fijo' : 'Variable'}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}, ${esIngreso ? 'ingreso' : 'gasto'} de ${moneda(movimiento.valor)}`}
      accessibilityHint={onPress ? 'Abre el movimiento para editarlo o eliminarlo' : undefined}
      style={({ pressed }) => [estilos.fila, pressed && { backgroundColor: colores.fondo }]}
    >
      <View style={[estilos.icono, { backgroundColor: estilo.fondo }]}>
        <Ionicons name={estilo.icono} size={20} color={estilo.color} />
      </View>
      <View style={estilos.textos}>
        <Text style={estilos.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        <Text style={estilos.detalle} numberOfLines={1}>
          {mostrarFecha ? `${detalle} · ${fechaCorta(movimiento.fecha)}` : detalle}
        </Text>
      </View>
      <Text style={[estilos.valor, { color: esIngreso ? colores.ingreso : colores.texto }]}>
        {esIngreso ? '+' : '-'}
        {moneda(movimiento.valor)}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.md,
    borderRadius: radio.md,
  },
  icono: { width: 44, height: 44, borderRadius: radio.md, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, minWidth: 0 },
  titulo: { fontSize: 15, fontWeight: '700', color: colores.texto },
  detalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
  valor: { fontSize: 15, fontWeight: '800' },
});
