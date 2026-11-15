import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { EncabezadoAdmin, estilosAdmin, Insignia, insigniaEstado } from '@/components/Admin';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { Pantalla } from '@/components/Pantalla';
import { api, mensajeError } from '@/lib/api';
import { fechaCorta, iniciales } from '@/lib/formato';
import type { PaginaUsuarios, UsuarioAdmin } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

const POR_PAGINA = 15;

// HU-25: ver y buscar los usuarios registrados (CA-49, CA-50).
export default function UsuariosAdmin() {
  const [buscar, setBuscar] = useState('');
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const solicitud = useRef(0);

  const cargar = useCallback(async (texto: string, numero: number) => {
    const actual = ++solicitud.current;
    setCargando(true);
    try {
      const r = await api.get<PaginaUsuarios>(
        `/admin/usuarios?pagina=${numero}&porPagina=${POR_PAGINA}&buscar=${encodeURIComponent(texto.trim())}`,
      );
      if (actual !== solicitud.current) return;
      setUsuarios((previos) => (numero === 1 ? r.datos : [...previos, ...r.datos]));
      setPagina(r.pagina);
      setPaginas(r.paginas);
      setTotal(r.total);
      setError('');
    } catch (e) {
      if (actual === solicitud.current) setError(mensajeError(e));
    } finally {
      if (actual === solicitud.current) setCargando(false);
    }
  }, []);

  // La búsqueda se lanza 350 ms después de que el administrador deja de escribir.
  useEffect(() => {
    const t = setTimeout(() => void cargar(buscar, 1), 350);
    return () => clearTimeout(t);
  }, [buscar, cargar]);

  // Al volver del detalle se recarga para reflejar cambios de estado o rol.
  const buscarActual = useRef(buscar);
  useEffect(() => {
    buscarActual.current = buscar;
  }, [buscar]);
  useFocusEffect(
    useCallback(() => {
      void cargar(buscarActual.current, 1);
    }, [cargar]),
  );

  return (
    <Pantalla>
      <EncabezadoAdmin titulo="Usuarios" subtitulo={`${total} ${total === 1 ? 'cuenta encontrada' : 'cuentas encontradas'}`} />
      <Campo
        etiqueta="Buscar por nombre o correo"
        icono="search-outline"
        value={buscar}
        onChangeText={setBuscar}
        placeholder="Ej: laura o laura@correo.com"
        autoCapitalize="none"
        returnKeyType="search"
      />
      {error ? <Aviso mensaje={error} /> : null}

      {usuarios.length === 0 && !cargando ? (
        <View style={[estilosAdmin.tarjeta, estilos.vacio]}>
          <Ionicons name="search-outline" size={28} color={colores.textoTenue} />
          <Text style={estilosAdmin.detalle}>{`No hay usuarios que coincidan con "${buscar}".`}</Text>
        </View>
      ) : (
        <View style={[estilosAdmin.tarjeta, { padding: espacio.xs }]}>
          {usuarios.map((u) => {
            const e = insigniaEstado(u.estado);
            return (
              <Pressable
                key={u.id}
                onPress={() => router.push({ pathname: '/admin/usuario/[id]', params: { id: u.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${u.nombre}, ${u.correo}, ${e.texto}`}
                style={({ pressed }) => [estilos.usuario, pressed && { backgroundColor: colores.fondo }]}
              >
                <View style={[estilos.avatar, u.estado === 'inactivo' && { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[estilos.avatarTexto, u.estado === 'inactivo' && { color: colores.textoTenue }]}>{iniciales(u.nombre)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilosAdmin.nombre} numberOfLines={1}>
                    {u.nombre}
                  </Text>
                  <Text style={estilosAdmin.detalle} numberOfLines={1}>
                    {u.correo}
                  </Text>
                  <Text style={estilos.fecha}>Registro: {fechaCorta(u.fecha_registro)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Insignia {...e} />
                  {u.rol === 'administrador' ? <Insignia texto="Admin" color={colores.primarioOscuro} fondo="#E0ECF4" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {cargando ? <ActivityIndicator color={colores.primario} style={{ marginVertical: espacio.lg }} /> : null}
      {!cargando && pagina < paginas ? (
        <Boton titulo={`Cargar más (${usuarios.length} de ${total})`} variante="secundario" onPress={() => cargar(buscar, pagina + 1)} />
      ) : null}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  vacio: { alignItems: 'center', gap: espacio.sm, paddingVertical: espacio.xl },
  usuario: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, padding: espacio.md, borderRadius: radio.md },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E0ECF4', alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontSize: 14, fontWeight: '800', color: colores.primarioOscuro },
  fecha: { fontSize: 12, color: colores.textoTenue, marginTop: 2 },
});
