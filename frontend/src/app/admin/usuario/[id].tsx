import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { estilosAdmin, Insignia, insigniaEstado } from '@/components/Admin';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Dialogo } from '@/components/Dialogo';
import { Pantalla } from '@/components/Pantalla';
import { useSesion } from '@/context/sesion';
import { useDatos } from '@/hooks/useDatos';
import { api, mensajeError } from '@/lib/api';
import { fechaCorta, iniciales } from '@/lib/formato';
import type { DetalleUsuarioAdmin } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

type Cambio = { tipo: 'estado'; valor: 'activo' | 'inactivo' } | { tipo: 'rol'; valor: 'usuario' | 'administrador' };

// HU-27: datos generales de una cuenta sin información financiera (CA-53, CA-54).
// HU-26: activar o desactivar (CA-51, CA-52). HU-32: asignar rol (CA-63).
export default function DetalleUsuario() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario: yo } = useSesion();
  const { datos: u, error, cargando, recargar } = useDatos(() => api.get<DetalleUsuarioAdmin>(`/admin/usuarios/${id}`), id);
  const [cambio, setCambio] = useState<Cambio | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  if (cargando && !u) {
    return (
      <Pantalla bordes={['bottom']}>
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
      </Pantalla>
    );
  }
  if (!u) {
    return (
      <Pantalla bordes={['bottom']}>
        <Aviso mensaje={error || 'No encontramos esta cuenta.'} />
      </Pantalla>
    );
  }

  const soyYo = u.id === yo?.id;
  const confirmar = async () => {
    if (!cambio) return;
    setGuardando(true);
    try {
      await api.patch(`/admin/usuarios/${u.id}/${cambio.tipo}`, { [cambio.tipo]: cambio.valor });
      setMensaje({
        tipo: 'exito',
        texto:
          cambio.tipo === 'estado'
            ? cambio.valor === 'inactivo'
              ? 'La cuenta quedó desactivada. Sus registros se conservan.'
              : 'La cuenta quedó activa. El usuario puede volver a iniciar sesión.'
            : cambio.valor === 'administrador'
              ? 'La cuenta ahora es administradora y puede entrar al panel.'
              : 'La cuenta ahora tiene rol de usuario.',
      });
      await recargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    } finally {
      setGuardando(false);
      setCambio(null);
    }
  };

  const textosDialogo =
    cambio?.tipo === 'estado'
      ? cambio.valor === 'inactivo'
        ? { titulo: '¿Desactivar esta cuenta?', mensaje: `${u.nombre} no podrá iniciar sesión. Sus registros no se borran.`, boton: 'Desactivar' }
        : { titulo: '¿Activar esta cuenta?', mensaje: `${u.nombre} podrá volver a iniciar sesión con su información intacta.`, boton: 'Activar' }
      : cambio?.valor === 'administrador'
        ? { titulo: '¿Hacer administrador?', mensaje: `${u.nombre} podrá entrar al panel administrativo.`, boton: 'Confirmar' }
        : { titulo: '¿Quitar rol de administrador?', mensaje: `${u.nombre} dejará de tener acceso al panel administrativo.`, boton: 'Confirmar' };

  return (
    <Pantalla bordes={['bottom']}>
      {mensaje ? <Aviso tipo={mensaje.tipo} mensaje={mensaje.texto} /> : null}

      <View style={[estilosAdmin.tarjeta, estilos.cabecera]}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>{iniciales(u.nombre)}</Text>
        </View>
        <Text style={estilos.nombre}>{u.nombre}</Text>
        <Text style={estilosAdmin.detalle}>{u.correo}</Text>
        <View style={estilos.insignias}>
          <Insignia {...insigniaEstado(u.estado)} />
          <Insignia
            texto={u.rol === 'administrador' ? 'Administrador' : 'Usuario'}
            color={colores.primarioOscuro}
            fondo="#E0ECF4"
          />
        </View>
      </View>

      <Text style={estilosAdmin.seccion}>Datos generales</Text>
      <View style={estilosAdmin.tarjeta}>
        <Dato icono="calendar-outline" etiqueta="Fecha de registro" valor={fechaCorta(u.fecha_registro)} />
        <Dato icono="time-outline" etiqueta="Último acceso" valor={u.ultimo_acceso ? fechaCorta(u.ultimo_acceso) : 'Sin registro'} />
      </View>

      <Text style={estilosAdmin.seccion}>Actividad general</Text>
      <View style={estilosAdmin.grilla}>
        <Mini valor={u.dias_activo} etiqueta="días activo" />
        <Mini valor={u.dias_activo_30} etiqueta="días activo (30 días)" />
        <Mini valor={u.retos_iniciados} etiqueta="retos iniciados" />
        <Mini valor={u.retos_cumplidos} etiqueta="retos cumplidos" />
        <Mini valor={u.logros} etiqueta="logros" />
        <Mini valor={u.solicitudes} etiqueta="solicitudes de soporte" />
      </View>
      {/* CA-54: el administrador nunca ve ingresos, gastos ni metas */}
      <Aviso
        tipo="info"
        mensaje="Por privacidad, el panel no muestra los ingresos, gastos ni metas del usuario."
        estilo={{ marginTop: espacio.md }}
      />

      {soyYo ? (
        <Aviso tipo="advertencia" mensaje="Esta es tu propia cuenta: no puedes desactivarla ni cambiar su rol." />
      ) : (
        <View style={{ gap: espacio.md }}>
          <Boton
            titulo={u.estado === 'activo' ? 'Desactivar cuenta' : 'Activar cuenta'}
            icono={u.estado === 'activo' ? 'ban-outline' : 'checkmark-circle-outline'}
            variante={u.estado === 'activo' ? 'peligro' : 'primario'}
            onPress={() => setCambio({ tipo: 'estado', valor: u.estado === 'activo' ? 'inactivo' : 'activo' })}
          />
          <Boton
            titulo={u.rol === 'administrador' ? 'Quitar rol de administrador' : 'Asignar rol de administrador'}
            icono="key-outline"
            variante="secundario"
            onPress={() => setCambio({ tipo: 'rol', valor: u.rol === 'administrador' ? 'usuario' : 'administrador' })}
          />
        </View>
      )}

      <Dialogo
        visible={!!cambio}
        titulo={textosDialogo.titulo}
        mensaje={textosDialogo.mensaje}
        textoConfirmar={textosDialogo.boton}
        peligro={cambio?.tipo === 'estado' && cambio.valor === 'inactivo'}
        icono={cambio?.tipo === 'rol' ? 'key' : cambio?.valor === 'inactivo' ? 'ban' : 'checkmark-circle'}
        cargando={guardando}
        alCancelar={() => setCambio(null)}
        alConfirmar={confirmar}
      />
    </Pantalla>
  );
}

function Dato({ icono, etiqueta, valor }: { icono: ComponentProps<typeof Ionicons>['name']; etiqueta: string; valor: string }) {
  return (
    <View style={estilos.dato}>
      <Ionicons name={icono} size={18} color={colores.textoSuave} />
      <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
      <Text style={estilos.datoValor}>{valor}</Text>
    </View>
  );
}

function Mini({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <View style={estilos.mini}>
      <Text style={estilos.miniValor}>{valor}</Text>
      <Text style={estilos.miniEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: { alignItems: 'center', paddingVertical: espacio.xl },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E0ECF4', alignItems: 'center', justifyContent: 'center', marginBottom: espacio.md },
  avatarTexto: { fontSize: 24, fontWeight: '800', color: colores.primarioOscuro },
  nombre: { fontSize: 20, fontWeight: '800', color: colores.texto },
  insignias: { flexDirection: 'row', gap: espacio.sm, marginTop: espacio.md },
  dato: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm, paddingVertical: espacio.sm },
  datoEtiqueta: { flex: 1, fontSize: 14, color: colores.textoSuave },
  datoValor: { fontSize: 14, fontWeight: '700', color: colores.texto },
  mini: { flexBasis: '30%', flexGrow: 1, backgroundColor: colores.tarjeta, borderRadius: radio.md, padding: espacio.md, borderWidth: 1, borderColor: colores.borde },
  miniValor: { fontSize: 22, fontWeight: '800', color: colores.texto },
  miniEtiqueta: { fontSize: 12, color: colores.textoSuave },
});
