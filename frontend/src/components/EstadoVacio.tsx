import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colores, espacio, radio, sombra } from '@/theme';
import { Boton } from './Boton';

interface Props {
  icono: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  mensaje: string;
  accion?: { titulo: string; onPress: () => void };
}

export function EstadoVacio({ icono, titulo, mensaje, accion }: Props) {
  return (
    <View style={estilos.caja}>
      <View style={estilos.icono}>
        <Ionicons name={icono} size={30} color={colores.primario} />
      </View>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>
      {accion ? <Boton titulo={accion.titulo} icono="add" onPress={accion.onPress} estilo={{ alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    backgroundColor: colores.tarjeta,
    borderRadius: radio.lg,
    padding: espacio.xl,
    alignItems: 'center',
    ...sombra,
  },
  icono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacio.md,
  },
  titulo: { fontSize: 17, fontWeight: '800', color: colores.texto, textAlign: 'center', marginBottom: espacio.xs },
  mensaje: { fontSize: 14, color: colores.textoSuave, textAlign: 'center', lineHeight: 20, marginBottom: espacio.lg },
});
