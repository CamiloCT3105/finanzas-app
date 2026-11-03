import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colores, degradadoSaldo, espacio, radio, sombra } from '@/theme';

export const estilosAuth = StyleSheet.create({
  tarjeta: { backgroundColor: colores.tarjeta, borderRadius: radio.xl, padding: espacio.xl, ...sombra },
  pie: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: espacio.xl, flexWrap: 'wrap' },
  pieTexto: { fontSize: 15, color: colores.textoSuave },
  enlace: { fontSize: 15, fontWeight: '700', color: colores.primario, padding: espacio.xs },
});

export function EncabezadoAuth({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <View style={estilos.contenedor}>
      <LinearGradient colors={degradadoSaldo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.logo}>
        <Ionicons name="wallet" size={30} color={colores.blanco} />
      </LinearGradient>
      <Text style={estilos.marca}>Finanzas App</Text>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.subtitulo}>{subtitulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', marginTop: espacio.xl, marginBottom: espacio.xl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radio.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacio.md,
  },
  marca: { fontSize: 13, fontWeight: '700', color: colores.primario, letterSpacing: 1, textTransform: 'uppercase' },
  titulo: { fontSize: 26, fontWeight: '800', color: colores.texto, marginTop: espacio.sm, textAlign: 'center' },
  subtitulo: { fontSize: 15, color: colores.textoSuave, marginTop: espacio.xs, textAlign: 'center', lineHeight: 21 },
});
