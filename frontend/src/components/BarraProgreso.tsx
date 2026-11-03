import { StyleSheet, View } from 'react-native';
import { colores, radio } from '@/theme';

export function BarraProgreso({
  porcentaje,
  color = colores.primario,
  fondo = '#E7EBF1',
  alto = 8,
}: {
  porcentaje: number;
  color?: string;
  fondo?: string;
  alto?: number;
}) {
  const ancho = Math.max(0, Math.min(100, porcentaje));
  return (
    <View
      style={[estilos.pista, { backgroundColor: fondo, height: alto }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ancho) }}
    >
      <View style={[estilos.barra, { width: `${ancho}%`, backgroundColor: color }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pista: { width: '100%', borderRadius: radio.total, overflow: 'hidden' },
  barra: { height: '100%', borderRadius: radio.total },
});
