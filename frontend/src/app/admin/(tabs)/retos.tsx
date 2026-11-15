import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { EncabezadoAdmin, estilosAdmin, Insignia, insigniaEstado } from '@/components/Admin';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Pantalla } from '@/components/Pantalla';
import { useDatos } from '@/hooks/useDatos';
import { api, mensajeError } from '@/lib/api';
import { moneda } from '@/lib/formato';
import type { RetoAdmin } from '@/lib/tipos';
import { colores, espacio } from '@/theme';

// HU-30: crear, editar, activar y desactivar los retos de ahorro.
export default function RetosAdmin() {
  const { datos: retos, error, cargando, refrescando, recargar } = useDatos(() => api.get<RetoAdmin[]>('/admin/retos'));
  const [cambiando, setCambiando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  const alternar = async (reto: RetoAdmin) => {
    setCambiando(reto.id);
    setMensaje('');
    try {
      await api.patch(`/admin/retos/${reto.id}/estado`, { estado: reto.estado === 'activo' ? 'inactivo' : 'activo' });
      await recargar();
    } catch (e) {
      setMensaje(mensajeError(e));
    } finally {
      setCambiando(null);
    }
  };

  return (
    <Pantalla refrescando={refrescando} alRefrescar={recargar}>
      <EncabezadoAdmin titulo="Retos de ahorro" subtitulo="Catálogo de retos que ven los usuarios." />
      <Boton titulo="Nuevo reto" icono="add" onPress={() => router.push('/admin/reto')} estilo={{ marginBottom: espacio.lg }} />
      {error || mensaje ? <Aviso mensaje={error || mensaje} /> : null}
      {cargando && !retos ? <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xl }} /> : null}
      {retos?.map((r) => (
        <View key={r.id} style={[estilosAdmin.tarjeta, { gap: espacio.sm }, r.estado === 'inactivo' && { opacity: 0.75 }]}>
          <View style={estilosAdmin.fila}>
            <View style={{ flex: 1 }}>
              <Text style={estilosAdmin.nombre}>{r.nombre}</Text>
              <Text style={estilosAdmin.detalle}>{r.descripcion}</Text>
            </View>
            <Insignia {...insigniaEstado(r.estado)} />
          </View>
          <View style={estilos.datos}>
            <Dato icono="cash-outline" texto={`Objetivo ${moneda(r.objetivo)}`} />
            <Dato icono="calendar-outline" texto={`${r.duracion_dias} días`} />
            <Dato icono="people-outline" texto={`${r.participantes} participantes · ${r.cumplidos} cumplidos`} />
          </View>
          {r.condiciones ? <Text style={estilos.condiciones}>Condiciones: {r.condiciones}</Text> : null}
          <View style={[estilosAdmin.fila, estilos.acciones]}>
            <View style={estilos.interruptor}>
              <Switch
                value={r.estado === 'activo'}
                onValueChange={() => alternar(r)}
                disabled={cambiando === r.id}
                trackColor={{ true: colores.acento, false: colores.borde }}
                thumbColor={colores.blanco}
                accessibilityLabel={`${r.estado === 'activo' ? 'Desactivar' : 'Activar'} ${r.nombre}`}
              />
              <Text style={estilosAdmin.detalle}>{r.estado === 'activo' ? 'Disponible' : 'Oculto para usuarios'}</Text>
            </View>
            <Boton
              titulo="Editar"
              icono="create-outline"
              variante="fantasma"
              onPress={() => router.push({ pathname: '/admin/reto', params: { id: r.id } })}
            />
          </View>
        </View>
      ))}
    </Pantalla>
  );
}

function Dato({ icono, texto }: { icono: 'cash-outline' | 'calendar-outline' | 'people-outline'; texto: string }) {
  return (
    <View style={estilos.dato}>
      <Ionicons name={icono} size={14} color={colores.textoSuave} />
      <Text style={estilos.datoTexto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  datos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.md },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  datoTexto: { fontSize: 13, color: colores.textoSuave, fontWeight: '600' },
  condiciones: { fontSize: 13, color: colores.textoSuave, fontStyle: 'italic' },
  acciones: { justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colores.borde, paddingTop: espacio.sm },
  interruptor: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
});
