import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { estilosAdmin, Insignia } from '@/components/Admin';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { Chips } from '@/components/Opciones';
import { Pantalla } from '@/components/Pantalla';
import { useDatos } from '@/hooks/useDatos';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import { fechaCorta } from '@/lib/formato';
import { ESTADOS_SOPORTE, type EstadoSoporte, type SolicitudDetalleAdmin } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

// HU-34 (CA-68): cambiar el estado de una solicitud y registrar una anotación con fecha y responsable.
export default function SolicitudAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datos: s, error, cargando, recargar } = useDatos(() => api.get<SolicitudDetalleAdmin>(`/admin/soporte/${id}`), id);
  const [estado, setEstado] = useState<EstadoSoporte | null>(null);
  const [anotacion, setAnotacion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  if (cargando && !s) {
    return (
      <Pantalla bordes={['bottom']}>
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
      </Pantalla>
    );
  }
  if (!s) {
    return (
      <Pantalla bordes={['bottom']}>
        <Aviso mensaje={error || 'No encontramos esta solicitud.'} />
      </Pantalla>
    );
  }

  const estadoElegido = estado ?? (s.estado === 'pendiente' ? 'en_proceso' : s.estado);
  const e = ESTADOS_SOPORTE[s.estado];

  const guardar = async () => {
    const encontrados: Record<string, string> = {};
    if (!anotacion.trim()) encontrados.anotacion = 'Escribe una anotación sobre el seguimiento.';
    setErrores(encontrados);
    setMensaje(null);
    if (Object.keys(encontrados).length) return;
    setGuardando(true);
    try {
      await api.patch(`/admin/soporte/${s.id}`, { estado: estadoElegido, anotacion: anotacion.trim() });
      setAnotacion('');
      setEstado(null);
      setMensaje({ tipo: 'exito', texto: 'El estado y la anotación quedaron guardados.' });
      await recargar();
    } catch (err) {
      if (err instanceof ErrorApi) setErrores(err.campos);
      setMensaje({ tipo: 'error', texto: mensajeError(err) });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Pantalla bordes={['bottom']}>
      {mensaje ? <Aviso tipo={mensaje.tipo} mensaje={mensaje.texto} /> : null}
      <View style={[estilosAdmin.tarjeta, { gap: espacio.sm }]}>
        <View style={estilosAdmin.fila}>
          <Text style={[estilos.asunto, { flex: 1 }]}>{s.asunto}</Text>
          <Insignia texto={e.etiqueta} color={e.color} fondo={e.fondo} />
        </View>
        <Text style={estilosAdmin.detalle}>
          {s.usuario} ({s.correo}) · {fechaCorta(s.fecha)}
        </Text>
        <Text style={estilos.descripcion}>{s.descripcion}</Text>
      </View>

      <Text style={estilosAdmin.seccion}>Actualizar seguimiento</Text>
      <View style={estilosAdmin.tarjeta}>
        <Text style={estilos.etiqueta}>Nuevo estado</Text>
        <View style={{ marginBottom: espacio.lg }}>
          <Chips
            opciones={(Object.keys(ESTADOS_SOPORTE) as EstadoSoporte[]).map((k) => ({ valor: k, etiqueta: ESTADOS_SOPORTE[k].etiqueta }))}
            valor={estadoElegido}
            alCambiar={setEstado}
          />
        </View>
        <Campo
          etiqueta="Anotación"
          value={anotacion}
          onChangeText={setAnotacion}
          placeholder="Ej: Revisando el registro con el usuario."
          multiline
          maxLength={1000}
          error={errores.anotacion}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <Boton titulo="Guardar seguimiento" icono="save-outline" onPress={guardar} cargando={guardando} />
      </View>

      {s.seguimiento.length > 0 ? (
        <>
          <Text style={estilosAdmin.seccion}>Historial</Text>
          <View style={estilosAdmin.tarjeta}>
            {s.seguimiento.map((h, i) => {
              const he = ESTADOS_SOPORTE[h.estado];
              return (
                <View key={h.id} style={[estilos.historial, i > 0 && estilos.separador]}>
                  <View style={estilosAdmin.fila}>
                    <Insignia texto={he.etiqueta} color={he.color} fondo={he.fondo} />
                    <Text style={[estilosAdmin.detalle, { flex: 1, marginTop: 0 }]}>
                      {h.responsable ?? 'Administrador'} · {fechaCorta(h.fecha)}
                    </Text>
                  </View>
                  {h.anotacion ? <Text style={estilos.anotacion}>{h.anotacion}</Text> : null}
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  asunto: { fontSize: 17, fontWeight: '800', color: colores.texto },
  descripcion: { fontSize: 15, color: colores.texto, lineHeight: 22, backgroundColor: colores.fondo, borderRadius: radio.md, padding: espacio.md },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginBottom: espacio.sm },
  historial: { gap: espacio.sm, paddingVertical: espacio.sm },
  separador: { borderTopWidth: 1, borderTopColor: colores.borde },
  anotacion: { fontSize: 14, color: colores.texto, lineHeight: 20 },
});
