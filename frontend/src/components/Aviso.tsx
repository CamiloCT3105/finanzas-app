import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colores, espacio, radio } from '@/theme';

type Tipo = 'error' | 'advertencia' | 'info' | 'exito';

const TIPOS = {
  error: { fondo: colores.gastoSuave, color: colores.gasto, icono: 'alert-circle' },
  advertencia: { fondo: colores.advertenciaSuave, color: colores.advertencia, icono: 'warning' },
  info: { fondo: colores.infoSuave, color: colores.info, icono: 'information-circle' },
  exito: { fondo: colores.ingresoSuave, color: colores.ingreso, icono: 'checkmark-circle' },
} as const;

export function Aviso({
  tipo = 'error',
  titulo,
  mensaje,
  estilo,
}: {
  tipo?: Tipo;
  titulo?: string;
  mensaje: string;
  estilo?: StyleProp<ViewStyle>;
}) {
  const t = TIPOS[tipo];
  return (
    <View
      style={[estilos.caja, { backgroundColor: t.fondo }, estilo]}
      accessibilityRole={tipo === 'error' ? 'alert' : 'summary'}
    >
      <Ionicons name={t.icono} size={20} color={t.color} />
      <View style={{ flex: 1 }}>
        {titulo ? <Text style={[estilos.titulo, { color: t.color }]}>{titulo}</Text> : null}
        <Text style={[estilos.mensaje, { color: colores.texto }]}>{mensaje}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    gap: espacio.sm,
    padding: espacio.md,
    borderRadius: radio.md,
    marginBottom: espacio.lg,
  },
  titulo: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  mensaje: { fontSize: 14, lineHeight: 20 },
});
