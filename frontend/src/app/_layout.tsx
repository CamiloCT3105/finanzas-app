import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ProveedorSesion, useSesion } from '@/context/sesion';
import { colores } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RaizLayout() {
  return (
    <ProveedorSesion>
      <Navegacion />
    </ProveedorSesion>
  );
}

function Navegacion() {
  const { usuario, cargando } = useSesion();
  // Se espera la fuente de íconos para que no aparezcan en blanco al abrir la app.
  const [fuentesListas, errorFuentes] = useFonts(Ionicons.font);

  if (cargando || (!fuentesListas && !errorFuentes)) return null;
  SplashScreen.hide();

  // Solo se puede entrar a (app) con sesión iniciada y a (auth) sin ella (HU-02, CA-06).
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }}>
        <Stack.Protected guard={!!usuario}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!usuario}>
          <Stack.Screen name="login" />
          <Stack.Screen name="registro" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
