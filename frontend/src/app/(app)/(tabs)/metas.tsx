import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { BarraProgreso } from '@/components/BarraProgreso';
import { Boton } from '@/components/Boton';
import { EstadoVacio } from '@/components/EstadoVacio';
import { Pantalla } from '@/components/Pantalla';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import { fechaCorta, moneda } from '@/lib/formato';
import type { Meta } from '@/lib/tipos';
import { colores, espacio, radio, sombra } from '@/theme';

// HU-15 (CA-29): las metas creadas aparecen en esta lista.
export default function Metas() {
  const { datos: metas, error, cargando, refrescando, recargar } = useDatos(() => api.get<Meta[]>('/metas'));

  const totalObjetivo = metas?.reduce((a, m) => a + m.valor_objetivo, 0) ?? 0;
  const totalAhorrado = metas?.reduce((a, m) => a + m.valor_ahorrado, 0) ?? 0;

  return (
    <Pantalla refrescando={refrescando} alRefrescar={recargar}>
      <View style={estilos.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.titulo}>Metas de ahorro</Text>
          <Text style={estilos.subtitulo}>Ten claro para qué estás ahorrando.</Text>
        </View>
      </View>

      {error ? <Aviso mensaje={error} /> : null}

      {cargando && !metas ? (
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
      ) : metas && metas.length === 0 ? (
        <EstadoVacio
          icono="flag-outline"
          titulo="Aún no tienes metas"
          mensaje="Crea tu primera meta de ahorro: una moto, un viaje, un fondo de emergencia…"
          accion={{ titulo: 'Crear mi primera meta', onPress: () => router.push('/meta') }}
        />
      ) : metas ? (
        <>
          <View style={estilos.resumen}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.resumenEtiqueta}>Ahorrado en tus metas</Text>
              <Text style={estilos.resumenValor} numberOfLines={1} adjustsFontSizeToFit>
                {moneda(totalAhorrado)}
              </Text>
              <Text style={estilos.resumenDetalle}>de {moneda(totalObjetivo)} en {metas.length} {metas.length === 1 ? 'meta' : 'metas'}</Text>
            </View>
            <View style={estilos.resumenIcono}>
              <Ionicons name="trophy" size={28} color={colores.primario} />
            </View>
          </View>

          <Boton titulo="Nueva meta" icono="add" onPress={() => router.push('/meta')} estilo={{ marginBottom: espacio.lg }} />

          {metas.map((meta) => {
            const porcentaje = meta.valor_objetivo > 0 ? (meta.valor_ahorrado / meta.valor_objetivo) * 100 : 0;
            const cumplida = meta.estado === 'cumplida';
            return (
              <View key={meta.id} style={estilos.meta}>
                <View style={estilos.metaCabecera}>
                  <View style={[estilos.metaIcono, cumplida && { backgroundColor: colores.ingresoSuave }]}>
                    <Ionicons name={cumplida ? 'checkmark-circle' : 'flag'} size={22} color={cumplida ? colores.ingreso : colores.primario} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.metaNombre} numberOfLines={2}>
                      {meta.nombre}
                    </Text>
                    {meta.descripcion ? (
                      <Text style={estilos.metaDescripcion} numberOfLines={2}>
                        {meta.descripcion}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[estilos.porcentaje, cumplida && { color: colores.ingreso }]}>{Math.floor(porcentaje)} %</Text>
                </View>
                <BarraProgreso porcentaje={porcentaje} color={cumplida ? colores.ingreso : colores.primario} alto={10} />
                <View style={estilos.metaPie}>
                  <Text style={estilos.metaValores}>
                    <Text style={estilos.metaAhorrado}>{moneda(meta.valor_ahorrado)}</Text> de {moneda(meta.valor_objetivo)}
                  </Text>
                  {meta.fecha_limite ? (
                    <View style={estilos.fecha}>
                      <Ionicons name="calendar-outline" size={13} color={colores.textoSuave} />
                      <Text style={estilos.fechaTexto}>{fechaCorta(meta.fecha_limite)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </>
      ) : null}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', marginBottom: espacio.lg },
  titulo: { fontSize: 26, fontWeight: '800', color: colores.texto },
  subtitulo: { fontSize: 14, color: colores.textoSuave, marginTop: 2 },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.tarjeta,
    borderRadius: radio.xl,
    padding: espacio.xl,
    marginBottom: espacio.lg,
    ...sombra,
  },
  resumenEtiqueta: { fontSize: 13, fontWeight: '600', color: colores.textoSuave },
  resumenValor: { fontSize: 28, fontWeight: '800', color: colores.texto, marginVertical: 4 },
  resumenDetalle: { fontSize: 13, color: colores.textoSuave },
  resumenIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: espacio.md,
  },
  meta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radio.lg,
    padding: espacio.lg,
    marginBottom: espacio.md,
    gap: espacio.md,
    ...sombra,
  },
  metaCabecera: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
  metaIcono: {
    width: 44,
    height: 44,
    borderRadius: radio.md,
    backgroundColor: colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaNombre: { fontSize: 16, fontWeight: '800', color: colores.texto },
  metaDescripcion: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
  porcentaje: { fontSize: 16, fontWeight: '800', color: colores.primario },
  metaPie: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: espacio.sm },
  metaValores: { fontSize: 14, color: colores.textoSuave },
  metaAhorrado: { fontWeight: '800', color: colores.texto },
  fecha: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fechaTexto: { fontSize: 13, color: colores.textoSuave },
});
