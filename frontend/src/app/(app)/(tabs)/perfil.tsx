import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { Dialogo } from '@/components/Dialogo';
import { Pantalla } from '@/components/Pantalla';
import { useSesion } from '@/context/sesion';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import { fechaCorta, iniciales } from '@/lib/formato';
import type { Usuario } from '@/lib/tipos';
import { colores, degradadoSaldo, espacio, radio, sombra } from '@/theme';

// HU-03: ver y modificar los datos del perfil y cerrar sesión.
export default function Perfil() {
  const { usuario, actualizarUsuario, cerrarSesion } = useSesion();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [correo, setCorreo] = useState(usuario?.correo ?? '');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  if (!usuario) return null;
  const huboCambios = nombre.trim() !== usuario.nombre || correo.trim().toLowerCase() !== usuario.correo;

  const guardar = async () => {
    const encontrados: Record<string, string> = {};
    if (nombre.trim().length < 2) encontrados.nombre = 'Ingresa tu nombre (mínimo 2 caracteres).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) encontrados.correo = 'Ingresa un correo válido.';
    setErrores(encontrados);
    setMensaje(null);
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    try {
      // CA-05: el backend solo actualiza el registro del usuario del token.
      const actualizado = await api.put<Usuario>('/usuarios/perfil', { nombre: nombre.trim(), correo: correo.trim() });
      actualizarUsuario(actualizado);
      setMensaje({ tipo: 'exito', texto: 'Tus datos se guardaron correctamente.' });
    } catch (e) {
      if (e instanceof ErrorApi) setErrores(e.campos);
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Pantalla>
      <Text style={estilos.titulo}>Mi perfil</Text>

      <LinearGradient colors={degradadoSaldo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.tarjetaUsuario}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>{iniciales(usuario.nombre)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={estilos.nombre} numberOfLines={1}>
            {usuario.nombre}
          </Text>
          <Text style={estilos.correo} numberOfLines={1}>
            {usuario.correo}
          </Text>
          <View style={estilos.desde}>
            <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={estilos.desdeTexto}>Miembro desde {fechaCorta(usuario.fecha_registro)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={estilos.tarjeta}>
        <Text style={estilos.seccion}>Datos personales</Text>
        {mensaje ? <Aviso tipo={mensaje.tipo} mensaje={mensaje.texto} /> : null}
        <Campo
          etiqueta="Nombre"
          icono="person-outline"
          value={nombre}
          onChangeText={(v) => {
            setNombre(v);
            setMensaje(null);
          }}
          error={errores.nombre}
          maxLength={100}
          autoComplete="name"
        />
        <Campo
          etiqueta="Correo electrónico"
          icono="mail-outline"
          value={correo}
          onChangeText={(v) => {
            setCorreo(v);
            setMensaje(null);
          }}
          error={errores.correo}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Boton titulo="Guardar cambios" icono="save-outline" onPress={guardar} cargando={guardando} deshabilitado={!huboCambios} />
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.seccion}>Seguridad</Text>
        <Text style={estilos.nota}>
          Al cerrar sesión se borra tu acceso de este dispositivo y deberás ingresar tu correo y contraseña para volver.
        </Text>
        <Boton titulo="Cerrar sesión" variante="peligro" icono="log-out-outline" onPress={() => setConfirmarSalida(true)} />
      </View>

      <Dialogo
        visible={confirmarSalida}
        titulo="¿Cerrar sesión?"
        mensaje="Tendrás que ingresar tus datos de nuevo para volver a entrar."
        textoConfirmar="Cerrar sesión"
        icono="log-out-outline"
        peligro
        alCancelar={() => setConfirmarSalida(false)}
        alConfirmar={() => {
          setConfirmarSalida(false);
          void cerrarSesion();
        }}
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 26, fontWeight: '800', color: colores.texto, marginBottom: espacio.lg },
  tarjetaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.lg,
    borderRadius: radio.xl,
    padding: espacio.xl,
    marginBottom: espacio.lg,
    ...sombra,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontSize: 22, fontWeight: '800', color: colores.blanco },
  nombre: { fontSize: 20, fontWeight: '800', color: colores.blanco },
  correo: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  desde: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: espacio.sm },
  desdeTexto: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radio.lg,
    padding: espacio.xl,
    marginBottom: espacio.lg,
    ...sombra,
  },
  seccion: { fontSize: 16, fontWeight: '800', color: colores.texto, marginBottom: espacio.lg },
  nota: { fontSize: 14, color: colores.textoSuave, lineHeight: 20, marginBottom: espacio.lg },
});
