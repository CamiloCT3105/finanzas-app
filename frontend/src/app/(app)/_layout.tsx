import { Stack } from 'expo-router';
import { colores } from '@/theme';

export const unstable_settings = { anchor: '(tabs)' };

export default function AppLayout() {
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
      <Stack.Screen name="meta" options={{ title: 'Nueva meta', presentation: 'modal' }} />
    </Stack>
  );
}
