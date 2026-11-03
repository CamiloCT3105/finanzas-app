import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * URL del backend. Se puede fijar con EXPO_PUBLIC_API_URL en frontend/.env;
 * si no, se usa la IP del computador que corre Expo (sirve en Expo Go con el celular en la misma Wi-Fi).
 */
function calcularUrlBase(): string {
  const configurada = process.env.EXPO_PUBLIC_API_URL;
  if (configurada) return configurada.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:3000/api`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
}

export const URL_API = calcularUrlBase();

export class ErrorApi extends Error {
  constructor(
    public estado: number,
    mensaje: string,
    public campos: Record<string, string> = {},
  ) {
    super(mensaje);
  }
}

let tokenActual: string | null = null;
let alExpirarSesion: (() => void) | null = null;

export function configurarApi(token: string | null, onExpira?: () => void) {
  tokenActual = token;
  if (onExpira) alExpirarSesion = onExpira;
}

async function peticion<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(tokenActual ? { Authorization: `Bearer ${tokenActual}` } : {}),
      },
      ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}),
    });
  } catch {
    throw new ErrorApi(0, 'No pudimos conectarnos con el servidor. Revisa tu conexión e intenta de nuevo.');
  }

  if (respuesta.status === 204) return undefined as T;
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    if (respuesta.status === 401 && tokenActual) alExpirarSesion?.();
    throw new ErrorApi(respuesta.status, datos.mensaje ?? 'Ocurrió un error inesperado.', datos.campos ?? {});
  }
  return datos as T;
}

export const api = {
  get: <T>(ruta: string) => peticion<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo: unknown) => peticion<T>('POST', ruta, cuerpo),
  put: <T>(ruta: string, cuerpo: unknown) => peticion<T>('PUT', ruta, cuerpo),
  delete: (ruta: string) => peticion<void>('DELETE', ruta),
};

export function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
