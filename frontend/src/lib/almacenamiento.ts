import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// En el celular el token se guarda cifrado con SecureStore; en web, en localStorage.
export async function leer(clave: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(clave) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(clave);
}

export async function guardar(clave: string, valor: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (valor === null) globalThis.localStorage?.removeItem(clave);
      else globalThis.localStorage?.setItem(clave, valor);
    } catch {
      // Navegación privada o almacenamiento bloqueado: la sesión dura lo que dure la pestaña.
    }
    return;
  }
  if (valor === null) await SecureStore.deleteItemAsync(clave);
  else await SecureStore.setItemAsync(clave, valor);
}
