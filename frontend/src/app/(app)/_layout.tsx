import { Redirect, Stack } from 'expo-router';
import { useSesion } from '@/context/sesion';
import { colores } from '@/theme';

export const unstable_settings = { anchor: '(tabs)' };

export default function AppLayout() {
  const { usuario } = useSesion();

  // CA-47: un administrador entra directamente al panel administrativo.
  if (usuario?.rol === 'administrador') return <Redirect href="/admin" />;

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
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Inicio' }} />
      <Stack.Screen name="ingreso" options={{ title: 'Ingreso', presentation: 'modal' }} />
      <Stack.Screen name="gasto" options={{ title: 'Gasto', presentation: 'modal' }} />
      <Stack.Screen name="meta/nueva" options={{ title: 'Nueva meta', presentation: 'modal' }} />
      <Stack.Screen name="meta/[id]" options={{ title: 'Meta' }} />
      <Stack.Screen name="aporte" options={{ title: 'Registrar ahorro', presentation: 'modal' }} />
      <Stack.Screen name="gasto-evitado" options={{ title: 'Gasto evitado', presentation: 'modal' }} />
      <Stack.Screen name="avance-reto" options={{ title: 'Avance del reto', presentation: 'modal' }} />
      <Stack.Screen name="perfil" options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="soporte" options={{ title: 'Ayuda y soporte' }} />
    </Stack>
  );
}
