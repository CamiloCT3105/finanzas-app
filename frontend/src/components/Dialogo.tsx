import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, espacio, radio } from '@/theme';
import { Boton } from './Boton';

interface Props {
  visible: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  alConfirmar: () => void;
  alCancelar: () => void;
  peligro?: boolean;
  cargando?: boolean;
  icono?: ComponentProps<typeof Ionicons>['name'];
}

/** Diálogo de confirmación propio: Alert.alert no funciona en la versión web. */
export function Dialogo({ visible, titulo, mensaje, textoConfirmar, alConfirmar, alCancelar, peligro, cargando, icono }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={alCancelar}>
      <Pressable style={estilos.fondo} onPress={cargando ? undefined : alCancelar}>
        <Pressable style={estilos.caja} onPress={() => {}} accessibilityRole="alert">
          <View style={[estilos.icono, { backgroundColor: peligro ? colores.gastoSuave : colores.primarioSuave }]}>
            <Ionicons
              name={icono ?? (peligro ? 'trash' : 'help-circle')}
              size={26}
              color={peligro ? colores.gasto : colores.primario}
            />
          </View>
          <Text style={estilos.titulo}>{titulo}</Text>
          <Text style={estilos.mensaje}>{mensaje}</Text>
          <View style={estilos.botones}>
            <Boton titulo="Cancelar" variante="secundario" onPress={alCancelar} deshabilitado={cargando} estilo={{ flex: 1 }} />
            <Boton
              titulo={textoConfirmar}
              onPress={alConfirmar}
              cargando={cargando}
              estilo={[{ flex: 1 }, peligro && { backgroundColor: colores.gasto, borderColor: colores.gasto }]}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacio.xl,
  },
  caja: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colores.tarjeta,
    borderRadius: radio.xl,
    padding: espacio.xl,
    alignItems: 'center',
  },
  icono: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: espacio.md },
  titulo: { fontSize: 18, fontWeight: '800', color: colores.texto, textAlign: 'center', marginBottom: espacio.sm },
  mensaje: { fontSize: 15, color: colores.textoSuave, textAlign: 'center', lineHeight: 21, marginBottom: espacio.xl },
  botones: { flexDirection: 'row', gap: espacio.md, alignSelf: 'stretch' },
});
