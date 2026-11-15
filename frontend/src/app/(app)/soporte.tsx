import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { estilosFormulario } from '@/components/CampoValor';
import { Pantalla } from '@/components/Pantalla';
import { useDatos } from '@/hooks/useDatos';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import { fechaCorta } from '@/lib/formato';
import { ESTADOS_SOPORTE, type SolicitudSoporte } from '@/lib/tipos';
import { colores, espacio, radio, sombra } from '@/theme';

// El usuario envía solicitudes de soporte y ve su estado (el administrador las gestiona en HU-34).
export default function Soporte() {
  const { datos, recargar } = useDatos(() => api.get<SolicitudSoporte[]>('/soporte'));
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    const encontrados: Record<string, string> = {};
    if (asunto.trim().length < 4) encontrados.asunto = 'Escribe un asunto (mínimo 4 caracteres).';
    if (descripcion.trim().length < 10) encontrados.descripcion = 'Describe el problema (mínimo 10 caracteres).';
    setErrores(encontrados);
    setMensaje(null);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      await api.post('/soporte', { asunto: asunto.trim(), descripcion: descripcion.trim() });
      setAsunto('');
      setDescripcion('');
      setMensaje({ tipo: 'exito', texto: 'Recibimos tu solicitud. Te responderemos pronto.' });
      await recargar();
    } catch (e) {
      if (e instanceof ErrorApi) setErrores(e.campos);
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla bordes={['bottom']}>
      <Text style={estilosFormulario.intro}>¿Tienes un problema con la aplicación? Cuéntanos y el equipo de soporte te ayudará.</Text>
      {mensaje ? <Aviso tipo={mensaje.tipo} mensaje={mensaje.texto} /> : null}
      <View style={estilosFormulario.tarjeta}>
        <Campo etiqueta="Asunto" icono="chatbox-ellipses-outline" value={asunto} onChangeText={setAsunto} placeholder="Ej: No veo un gasto" maxLength={120} error={errores.asunto} />
        <Campo
          etiqueta="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Cuéntanos qué pasó"
          multiline
          numberOfLines={4}
          maxLength={1000}
          error={errores.descripcion}
          style={{ minHeight: 90, textAlignVertical: 'top' }}
        />
        <Boton titulo="Enviar solicitud" icono="send-outline" onPress={enviar} cargando={enviando} />
      </View>

      {datos && datos.length > 0 ? (
        <>
          <Text style={estilos.seccion}>Mis solicitudes</Text>
          {datos.map((s) => {
            const e = ESTADOS_SOPORTE[s.estado];
            return (
              <View key={s.id} style={estilos.solicitud}>
                <View style={estilos.fila}>
                  <Text style={estilos.asunto} numberOfLines={1}>
                    {s.asunto}
                  </Text>
                  <View style={[estilos.estado, { backgroundColor: e.fondo }]}>
                    <Text style={[estilos.estadoTexto, { color: e.color }]}>{e.etiqueta}</Text>
                  </View>
                </View>
                <Text style={estilos.descripcion} numberOfLines={3}>
                  {s.descripcion}
                </Text>
                {s.anotacion ? (
                  <View style={estilos.respuesta}>
                    <Text style={estilos.respuestaTitulo}>Respuesta de soporte</Text>
                    <Text style={estilos.respuestaTexto}>{s.anotacion}</Text>
                  </View>
                ) : null}
                <Text style={estilos.fecha}>Enviada el {fechaCorta(s.fecha)}</Text>
              </View>
            );
          })}
        </>
      ) : null}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  seccion: { fontSize: 17, fontWeight: '800', color: colores.texto, marginTop: espacio.xl, marginBottom: espacio.md },
  solicitud: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: espacio.lg, marginBottom: espacio.md, gap: espacio.sm, ...sombra },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  asunto: { flex: 1, fontSize: 15, fontWeight: '800', color: colores.texto },
  estado: { borderRadius: radio.total, paddingHorizontal: espacio.sm, paddingVertical: 3 },
  estadoTexto: { fontSize: 12, fontWeight: '700' },
  descripcion: { fontSize: 14, color: colores.textoSuave, lineHeight: 20 },
  respuesta: { backgroundColor: colores.infoSuave, borderRadius: radio.md, padding: espacio.md },
  respuestaTitulo: { fontSize: 12, fontWeight: '800', color: colores.info, marginBottom: 2 },
  respuestaTexto: { fontSize: 14, color: colores.texto },
  fecha: { fontSize: 12, color: colores.textoTenue },
});
