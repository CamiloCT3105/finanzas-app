import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { estilosAdmin, Insignia } from '@/components/Admin';
import { Aviso } from '@/components/Aviso';
import { Chips } from '@/components/Opciones';
import { Pantalla } from '@/components/Pantalla';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import { fechaCorta } from '@/lib/formato';
import { ESTADOS_SOPORTE, type EstadoSoporte, type SolicitudAdmin } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

type Filtro = 'todas' | EstadoSoporte;

// HU-34: lista de solicitudes de soporte con su estado (CA-67).
export default function SoporteAdmin() {
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const { datos, error, cargando, refrescando, recargar } = useDatos(
    () => api.get<SolicitudAdmin[]>(`/admin/soporte${filtro === 'todas' ? '' : `?estado=${filtro}`}`),
    filtro,
  );

  return (
    <Pantalla bordes={['bottom']} refrescando={refrescando} alRefrescar={recargar}>
      <View style={{ marginBottom: espacio.lg }}>
        <Chips
          opciones={[
            { valor: 'todas', etiqueta: 'Todas' },
            { valor: 'pendiente', etiqueta: 'Pendientes' },
            { valor: 'en_proceso', etiqueta: 'En proceso' },
            { valor: 'resuelta', etiqueta: 'Resueltas' },
          ]}
          valor={filtro}
          alCambiar={setFiltro}
        />
      </View>
      {error ? <Aviso mensaje={error} /> : null}
      {cargando && !datos ? <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xl }} /> : null}
      {datos && datos.length === 0 ? (
        <View style={[estilosAdmin.tarjeta, { alignItems: 'center', paddingVertical: espacio.xl }]}>
          <Text style={estilosAdmin.detalle}>No hay solicitudes {filtro === 'todas' ? '' : `en estado "${ESTADOS_SOPORTE[filtro].etiqueta.toLowerCase()}"`}.</Text>
        </View>
      ) : null}
      {datos && datos.length > 0 ? (
        <View style={[estilosAdmin.tarjeta, { padding: espacio.xs }]}>
          {datos.map((s) => {
            const e = ESTADOS_SOPORTE[s.estado];
            return (
              <Pressable
                key={s.id}
                onPress={() => router.push({ pathname: '/admin/solicitud/[id]', params: { id: s.id } })}
                accessibilityRole="button"
                style={({ pressed }) => [estilos.solicitud, pressed && { backgroundColor: colores.fondo }]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilosAdmin.nombre} numberOfLines={1}>
                    {s.asunto}
                  </Text>
                  <Text style={estilosAdmin.detalle} numberOfLines={1}>
                    {s.usuario} · {fechaCorta(s.fecha)}
                  </Text>
                </View>
                <Insignia texto={e.etiqueta} color={e.color} fondo={e.fondo} />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  solicitud: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, padding: espacio.md, borderRadius: radio.md },
});
