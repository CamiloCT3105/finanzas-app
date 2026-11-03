import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { ANCHO_MAXIMO, colores, espacio } from '@/theme';

interface Props {
  bordes?: Edge[];
  refrescando?: boolean;
  alRefrescar?: () => void;
  estiloContenido?: StyleProp<ViewStyle>;
  /** Contenido fijo debajo del scroll (por ejemplo, el botón Guardar de un formulario). */
  pie?: ReactNode;
  fondo?: string;
}

/**
 * Contenedor base de cada pantalla: respeta las zonas seguras del celular, levanta el contenido
 * cuando aparece el teclado y limita el ancho en tablets y web para que se vea centrado.
 */
export function Pantalla({
  children,
  bordes = ['top'],
  refrescando,
  alRefrescar,
  estiloContenido,
  pie,
  fondo = colores.fondo,
}: PropsWithChildren<Props>) {
  const { width } = useWindowDimensions();
  const margen = width < 380 ? espacio.lg : espacio.xl;

  return (
    <SafeAreaView edges={bordes} style={[estilos.raiz, { backgroundColor: fondo }]}>
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[estilos.scroll, { paddingHorizontal: margen }]}
          refreshControl={
            alRefrescar ? (
              <RefreshControl refreshing={!!refrescando} onRefresh={alRefrescar} tintColor={colores.primario} />
            ) : undefined
          }
        >
          <View style={[estilos.contenido, estiloContenido]}>{children}</View>
        </ScrollView>
        {pie ? (
          <View style={[estilos.pie, { paddingHorizontal: margen }]}>
            <View style={estilos.contenido}>{pie}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  scroll: { flexGrow: 1, paddingTop: espacio.lg, paddingBottom: espacio.xxl },
  contenido: { width: '100%', maxWidth: ANCHO_MAXIMO, alignSelf: 'center' },
  pie: {
    paddingVertical: espacio.md,
    backgroundColor: colores.tarjeta,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.borde,
  },
});
