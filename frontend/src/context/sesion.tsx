import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { api, configurarApi, ErrorApi } from '@/lib/api';
import { guardar, leer } from '@/lib/almacenamiento';
import type { RespuestaSesion, Usuario } from '@/lib/tipos';

const CLAVE_TOKEN = 'finanzas.token';
const CLAVE_USUARIO = 'finanzas.usuario';

interface ContextoSesion {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  registrarse: (nombre: string, correo: string, contrasena: string) => Promise<void>;
  actualizarUsuario: (usuario: Usuario) => void;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<ContextoSesion | null>(null);

export function useSesion() {
  const valor = use(Contexto);
  if (!valor) throw new Error('useSesion debe usarse dentro de <ProveedorSesion />');
  return valor;
}

export function ProveedorSesion({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // CA-06: cerrar sesión borra el token del dispositivo y vuelve al inicio de sesión.
  const cerrarSesion = useCallback(async () => {
    configurarApi(null);
    setUsuario(null);
    await Promise.all([guardar(CLAVE_TOKEN, null), guardar(CLAVE_USUARIO, null)]);
  }, []);

  const abrirSesion = useCallback(
    async ({ token, usuario }: RespuestaSesion) => {
      configurarApi(token, () => void cerrarSesion());
      await Promise.all([guardar(CLAVE_TOKEN, token), guardar(CLAVE_USUARIO, JSON.stringify(usuario))]);
      setUsuario(usuario);
    },
    [cerrarSesion],
  );

  // Al abrir la app se recupera la sesión guardada y se valida contra el backend.
  useEffect(() => {
    (async () => {
      try {
        const [token, guardado] = await Promise.all([leer(CLAVE_TOKEN), leer(CLAVE_USUARIO)]);
        if (!token) return;
        configurarApi(token, () => void cerrarSesion());
        if (guardado) setUsuario(JSON.parse(guardado));
        try {
          const perfil = await api.get<Usuario>('/usuarios/perfil');
          setUsuario(perfil);
          await guardar(CLAVE_USUARIO, JSON.stringify(perfil));
        } catch (error) {
          // Sin conexión se mantiene la sesión guardada; con token inválido se cierra.
          if (error instanceof ErrorApi && (error.estado === 401 || error.estado === 404)) await cerrarSesion();
        }
      } finally {
        setCargando(false);
      }
    })();
  }, [cerrarSesion]);

  const valor = useMemo<ContextoSesion>(
    () => ({
      usuario,
      cargando,
      iniciarSesion: async (correo, contrasena) => {
        await abrirSesion(await api.post<RespuestaSesion>('/auth/login', { correo, contrasena }));
      },
      registrarse: async (nombre, correo, contrasena) => {
        await abrirSesion(await api.post<RespuestaSesion>('/auth/registro', { nombre, correo, contrasena }));
      },
      actualizarUsuario: (nuevo) => {
        setUsuario(nuevo);
        void guardar(CLAVE_USUARIO, JSON.stringify(nuevo));
      },
      cerrarSesion,
    }),
    [usuario, cargando, abrirSesion, cerrarSesion],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
