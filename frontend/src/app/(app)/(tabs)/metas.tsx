import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { BarraProgreso } from '@/components/BarraProgreso';
import { Boton } from '@/components/Boton';
import { EstadoVacio } from '@/components/EstadoVacio';
import { Pantalla } from '@/components/Pantalla';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import { fechaCorta, moneda } from '@/lib/formato';
import { textoEstimacion } from '@/lib/metas';
import type { MetaConProgreso } from '@/lib/tipos';
import { colores, espacio, radio, sombra } from '@/theme';

// HU-15 y HU-18: metas con su progreso; al tocar una se abre su detalle.
export default function Metas() {
  const { datos: metas, error, cargando, refrescando, recargar } = useDatos(() => api.get<MetaConProgreso[]>('/metas'));

  const totalObjetivo = metas?.reduce((a, m) => a + m.valor_objetivo, 0) ?? 0;
  const totalAhorrado = metas?.reduce((a, m) => a + m.valor_ahorrado, 0) ?? 0;
  const porcentajeTotal = totalObjetivo > 0 ? Math.min(100, Math.floor((totalAhorrado / totalObjetivo) * 100)) : 0;

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
        // CA-36: sin metas se invita a crear la primera
        <EstadoVacio
          icono="flag-outline"
          titulo="Aún no tienes metas"
          mensaje="Crea tu primera meta de ahorro: una moto, un viaje, un fondo de emergencia…"
          accion={{ titulo: 'Crear mi primera meta', onPress: () => router.push('/meta/nueva') }}
        />
      ) : metas ? (
        <>
          <View style={estilos.resumen}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.resumenEtiqueta}>Ahorrado en tus metas</Text>
              <Text style={estilos.resumenValor} numberOfLines={1} adjustsFontSizeToFit>
                {moneda(totalAhorrado)}
              </Text>
              <Text style={estilos.resumenDetalle}>
                de {moneda(totalObjetivo)} en {metas.length} {metas.length === 1 ? 'meta' : 'metas'}
              </Text>
              <BarraProgreso porcentaje={porcentajeTotal} alto={8} />
            </View>
            <View style={estilos.resumenIcono}>
              <Ionicons name="trophy" size={28} color={colores.primario} />
            </View>
          </View>

          <View style={estilos.botones}>
            <Boton titulo="Nueva meta" icono="add" onPress={() => router.push('/meta/nueva')} estilo={{ flex: 1 }} />
            <Boton
              titulo="Gasto evitado"
              icono="shield-checkmark-outline"
              variante="secundario"
              onPress={() => router.push('/gasto-evitado')}
              estilo={{ flex: 1 }}
            />
          </View>

          {metas.map((meta) => {
            const cumplida = meta.estado === 'cumplida';
            const estimacion = textoEstimacion(meta);
            return (
              <Pressable
                key={meta.id}
                onPress={() => router.push({ pathname: '/meta/[id]', params: { id: meta.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${meta.nombre}: ${meta.porcentaje} %, faltan ${moneda(meta.restante)}`}
                style={({ pressed }) => [estilos.meta, pressed && { opacity: 0.9 }]}
              >
                <View style={estilos.metaCabecera}>
                  <View style={[estilos.metaIcono, cumplida && { backgroundColor: colores.ingresoSuave }]}>
                    <Ionicons name={cumplida ? 'checkmark-circle' : 'flag'} size={22} color={cumplida ? colores.ingreso : colores.primario} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.metaNombre} numberOfLines={2}>
                      {meta.nombre}
                    </Text>
                    <Text style={estilos.metaDetalle}>
                      {moneda(meta.valor_ahorrado)} de {moneda(meta.valor_objetivo)}
                    </Text>
                  </View>
                  <Text style={[estilos.porcentaje, cumplida && { color: colores.ingreso }]}>{meta.porcentaje} %</Text>
                </View>
                <BarraProgreso porcentaje={meta.porcentaje} color={cumplida ? colores.ingreso : colores.primario} alto={10} />
                <View style={estilos.metaPie}>
                  {!cumplida ? (
                    <Text style={estilos.restante}>
                      Faltan <Text style={estilos.restanteValor}>{moneda(meta.restante)}</Text>
                    </Text>
                  ) : null}
                  <View style={estilos.estimacion}>
                    <Ionicons
                      name={estimacion.aviso ? 'alert-circle-outline' : cumplida ? 'trophy-outline' : 'time-outline'}
                      size={14}
                      color={estimacion.aviso ? colores.advertencia : cumplida ? colores.ingreso : colores.textoSuave}
                    />
                    <Text
                      style={[estilos.estimacionTexto, estimacion.aviso && { color: colores.advertencia }, cumplida && { color: colores.ingreso }]}
                      numberOfLines={2}
                    >
                      {estimacion.texto}
                    </Text>
                  </View>
                </View>
                {meta.fecha_limite && !cumplida ? (
                  <Text style={estilos.fechaLimite}>Fecha límite: {fechaCorta(meta.fecha_limite)}</Text>
                ) : null}
              </Pressable>
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
  resumenDetalle: { fontSize: 13, color: colores.textoSuave, marginBottom: espacio.sm },
  resumenIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: espacio.md,
  },
  botones: { flexDirection: 'row', gap: espacio.md, marginBottom: espacio.lg },
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
  metaDetalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
  porcentaje: { fontSize: 17, fontWeight: '800', color: colores.primario },
  metaPie: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: espacio.sm },
  restante: { fontSize: 14, color: colores.textoSuave },
  restanteValor: { fontWeight: '800', color: colores.texto },
  estimacion: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  estimacionTexto: { fontSize: 13, color: colores.textoSuave, flexShrink: 1 },
  fechaLimite: { fontSize: 12, color: colores.textoTenue },
});
