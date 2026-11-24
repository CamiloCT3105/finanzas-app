import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Boton } from '@/components/Boton';
import { Pantalla } from '@/components/Pantalla';
import { useSesion } from '@/context/sesion';
import { colores, espacio } from '@/theme';

export const unstable_settings = { anchor: '(tabs)' };

// HU-24: el panel administrativo solo se muestra a cuentas con rol de administrador (CA-47, CA-48).
export default function AdminLayout() {
  const { usuario } = useSesion();

  if (usuario?.rol !== 'administrador') {
    return (
      <Pantalla bordes={['top', 'bottom']} estiloContenido={estilos.denegado}>
        <View style={estilos.icono}>
          <Ionicons name="lock-closed" size={36} color={colores.gasto} />
        </View>
        <Text style={estilos.titulo}>Acceso denegado</Text>
        <Text style={estilos.mensaje}>
          Esta sección es solo para administradores. Tu cuenta no tiene permisos para entrar al panel administrativo.
        </Text>
        <Boton titulo="Volver a mis finanzas" icono="home-outline" onPress={() => router.replace('/')} estilo={{ alignSelf: 'stretch' }} />
      </Pantalla>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.fondo },
        headerShadowVisible: false,
        headerTintColor: colores.texto,
        headerTitleStyle: { fontWeight: '800' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Panel' }} />
      <Stack.Screen name="usuario/[id]" options={{ title: 'Detalle de la cuenta' }} />
      <Stack.Screen name="reto" options={{ title: 'Reto', presentation: 'modal' }} />
      <Stack.Screen name="categoria" options={{ title: 'Categoría', presentation: 'modal' }} />
      <Stack.Screen name="actividad" options={{ title: 'Actividad de la plataforma' }} />
      <Stack.Screen name="reportes" options={{ title: 'Reportes' }} />
      <Stack.Screen name="soporte" options={{ title: 'Solicitudes de soporte' }} />
      <Stack.Screen name="solicitud/[id]" options={{ title: 'Solicitud' }} />
    </Stack>
  );
}

const estilos = StyleSheet.create({
  denegado: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: espacio.xxl },
  icono: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colores.gastoSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacio.lg,
  },
  titulo: { fontSize: 24, fontWeight: '800', color: colores.texto, marginBottom: espacio.sm },
  mensaje: { fontSize: 15, color: colores.textoSuave, textAlign: 'center', lineHeight: 22, marginBottom: espacio.xl },
});
