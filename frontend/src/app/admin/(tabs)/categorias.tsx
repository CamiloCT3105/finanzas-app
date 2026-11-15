import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { EncabezadoAdmin, estilosAdmin, Insignia, insigniaEstado } from '@/components/Admin';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Pantalla } from '@/components/Pantalla';
import { useDatos } from '@/hooks/useDatos';
import { api, mensajeError } from '@/lib/api';
import { estiloCategoria } from '@/lib/categorias';
import type { CategoriaAdmin } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

// HU-29: crear, editar y desactivar las categorías generales de gastos (CA-57, CA-58).
export default function CategoriasAdmin() {
  const { datos: categorias, error, cargando, refrescando, recargar } = useDatos(() => api.get<CategoriaAdmin[]>('/admin/categorias'));
  const [cambiando, setCambiando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  const alternar = async (c: CategoriaAdmin) => {
    setCambiando(c.id);
    setMensaje('');
    try {
      await api.patch(`/admin/categorias/${c.id}/estado`, { estado: c.estado === 'activo' ? 'inactivo' : 'activo' });
      await recargar();
    } catch (e) {
      setMensaje(mensajeError(e));
    } finally {
      setCambiando(null);
    }
  };

  return (
    <Pantalla refrescando={refrescando} alRefrescar={recargar}>
      <EncabezadoAdmin titulo="Categorías" subtitulo="Las categorías activas aparecen al registrar gastos." />
      <Boton titulo="Nueva categoría" icono="add" onPress={() => router.push('/admin/categoria')} estilo={{ marginBottom: espacio.lg }} />
      {error || mensaje ? <Aviso mensaje={error || mensaje} /> : null}
      <Aviso tipo="info" mensaje="Desactivar una categoría la oculta para gastos nuevos; los gastos anteriores la conservan." />
      {cargando && !categorias ? <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xl }} /> : null}
      {categorias ? (
        <View style={[estilosAdmin.tarjeta, { padding: espacio.xs }]}>
          {categorias.map((c) => {
            const e = estiloCategoria(c.nombre);
            return (
              <View key={c.id} style={[estilos.fila, c.estado === 'inactivo' && { opacity: 0.7 }]}>
                <View style={[estilos.icono, { backgroundColor: e.fondo }]}>
                  <Ionicons name={e.icono} size={20} color={e.color} />
                </View>
                <Pressable
                  style={{ flex: 1, minWidth: 0 }}
                  onPress={() => router.push({ pathname: '/admin/categoria', params: { id: c.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${c.nombre}`}
                >
                  <View style={estilos.nombreFila}>
                    <Text style={estilosAdmin.nombre} numberOfLines={1}>
                      {c.nombre}
                    </Text>
                    <Insignia {...insigniaEstado(c.estado)} />
                  </View>
                  <Text style={estilosAdmin.detalle} numberOfLines={1}>
                    {c.descripcion || 'Sin descripción'} · {c.gastos_asociados} gastos
                  </Text>
                </Pressable>
                <Switch
                  value={c.estado === 'activo'}
                  onValueChange={() => alternar(c)}
                  disabled={cambiando === c.id}
                  trackColor={{ true: colores.acento, false: colores.borde }}
                  thumbColor={colores.blanco}
                  accessibilityLabel={`${c.estado === 'activo' ? 'Desactivar' : 'Activar'} ${c.nombre}`}
                />
              </View>
            );
          })}
        </View>
      ) : null}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, padding: espacio.md, borderRadius: radio.md },
  icono: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nombreFila: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
});
