import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores } from '@/theme';

type Icono = ComponentProps<typeof Ionicons>['name'];

function icono(activo: Icono, inactivo: Icono) {
  function IconoTab({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? activo : inactivo} size={24} color={color as string} />;
  }
  return IconoTab;
}

export default function AdminTabsLayout() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.primarioOscuro,
        tabBarInactiveTintColor: colores.textoTenue,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colores.tarjeta,
          borderTopColor: colores.borde,
          height: 70 + bottom,
          paddingTop: 6,
          paddingBottom: bottom + 8,
        },
        sceneStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Resumen', tabBarIcon: icono('grid', 'grid-outline') }} />
      <Tabs.Screen name="usuarios" options={{ title: 'Usuarios', tabBarIcon: icono('people', 'people-outline') }} />
      <Tabs.Screen name="retos" options={{ title: 'Retos', tabBarIcon: icono('trophy', 'trophy-outline') }} />
      <Tabs.Screen name="categorias" options={{ title: 'Categorías', tabBarIcon: icono('pricetags', 'pricetags-outline') }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: icono('menu', 'menu-outline') }} />
    </Tabs>
  );
}
