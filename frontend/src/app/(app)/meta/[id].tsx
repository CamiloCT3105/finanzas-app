import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Dona } from '@/components/Graficas';
import { Pantalla } from '@/components/Pantalla';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import { fechaCorta, mesYAnio, moneda } from '@/lib/formato';
import { ETIQUETA_APORTE, type MetaDetalle, type TipoAporte } from '@/lib/tipos';
import { colores, espacio, radio, sombra } from '@/theme';

const ICONO_APORTE: Record<TipoAporte, ComponentProps<typeof Ionicons>['name']> = {
  ahorro: 'wallet',
  gasto_evitado: 'shield-checkmark',
  reto: 'trophy',
};

// HU-16 (meses para la meta), HU-17 (registrar ahorro) y HU-18 (progreso) de una meta.
export default function DetalleMeta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datos: meta, error, cargando, refrescando, recargar } = useDatos(() => api.get<MetaDetalle>(`/metas/${id}`), id);

  if (cargando && !meta) {
    return (
      <Pantalla bordes={['bottom']}>
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
      </Pantalla>
    );
  }
  if (!meta) {
    return (
      <Pantalla bordes={['bottom']}>
        <Aviso mensaje={error || 'No encontramos esta meta.'} />
      </Pantalla>
    );
  }

  const cumplida = meta.estado === 'cumplida';
  const e = meta.estimacion;
  const pasaLimite = !!(meta.fecha_limite && e.fechaEstimada && e.fechaEstimada > meta.fecha_limite);

  return (
    <>
      <Stack.Screen options={{ title: meta.nombre }} />
      <Pantalla
        bordes={['bottom']}
        refrescando={refrescando}
        alRefrescar={recargar}
        {...(!cumplida
          ? {
              pie: (
                <Boton
                  titulo="Registrar ahorro"
                  icono="add-circle-outline"
                  onPress={() => router.push({ pathname: '/aporte', params: { idMeta: meta.id, nombre: meta.nombre } })}
                />
              ),
            }
          : {})}
      >
        {/* HU-18 (CA-35): restante, porcentaje y barra de avance */}
        <View style={estilos.tarjeta}>
          <View style={estilos.progreso}>
            <Dona
              tamano={150}
              grosor={18}
              datos={[
                { valor: meta.valor_ahorrado, color: cumplida ? colores.ingreso : colores.primario, etiqueta: 'Ahorrado' },
                { valor: meta.restante, color: '#EEF1F5', etiqueta: 'Restante' },
              ]}
              centro={
                <>
                  <Text style={[estilos.porcentaje, cumplida && { color: colores.ingreso }]}>{meta.porcentaje} %</Text>
                  <Text style={estilos.porcentajeEtiqueta}>{cumplida ? 'cumplida' : 'de avance'}</Text>
                </>
              }
            />
            <View style={estilos.cifras}>
              <Cifra etiqueta="Ahorrado" valor={moneda(meta.valor_ahorrado)} color={cumplida ? colores.ingreso : colores.primario} />
              <Cifra etiqueta="Objetivo" valor={moneda(meta.valor_objetivo)} />
              <Cifra etiqueta="Restante" valor={moneda(meta.restante)} />
            </View>
          </View>
          {meta.descripcion ? <Text style={estilos.descripcion}>{meta.descripcion}</Text> : null}
        </View>

        {/* HU-16 (CA-31, CA-32): tiempo estimado para alcanzar la meta */}
        {cumplida ? (
          <Aviso tipo="exito" titulo="¡Meta cumplida!" mensaje="Alcanzaste el valor objetivo de esta meta. ¡Felicitaciones!" />
        ) : e.meses === null ? (
          <Aviso tipo="advertencia" titulo="No se puede estimar el tiempo" mensaje={e.aviso ?? ''} />
        ) : (
          <View style={estilos.estimacion}>
            <View style={estilos.estimacionIcono}>
              <Ionicons name="calendar" size={22} color={colores.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.estimacionTitulo}>
                La alcanzas en {e.meses} {e.meses === 1 ? 'mes' : 'meses'}
              </Text>
              <Text style={estilos.estimacionTexto}>
                Ahorrando {moneda(e.capacidadMensual)} al mes (tu capacidad de ahorro de este mes)
                {e.fechaEstimada ? `, aproximadamente en ${mesYAnio(e.fechaEstimada)}.` : '.'}
              </Text>
            </View>
          </View>
        )}
        {pasaLimite ? (
          <Aviso
            tipo="advertencia"
            mensaje={`A este ritmo no alcanzas tu fecha límite (${fechaCorta(meta.fecha_limite!)}). Intenta ahorrar un poco más cada mes.`}
          />
        ) : null}

        <Text style={estilos.seccion}>Aportes</Text>
        {meta.aportes.length === 0 ? (
          <View style={estilos.vacio}>
            <Text style={estilos.vacioTexto}>Aún no has registrado ahorros para esta meta.</Text>
          </View>
        ) : (
          <View style={estilos.lista}>
            {meta.aportes.map((a) => (
              <View key={a.id} style={estilos.aporte}>
                <View style={estilos.aporteIcono}>
                  <Ionicons name={ICONO_APORTE[a.tipo]} size={18} color={colores.primario} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.aporteTitulo} numberOfLines={1}>
                    {a.descripcion || ETIQUETA_APORTE[a.tipo]}
                  </Text>
                  <Text style={estilos.aporteDetalle}>
                    {ETIQUETA_APORTE[a.tipo]} · {fechaCorta(a.fecha)}
                  </Text>
                </View>
                <Text style={estilos.aporteValor}>+{moneda(a.valor)}</Text>
              </View>
            ))}
          </View>
        )}
      </Pantalla>
    </>
  );
}

function Cifra({ etiqueta, valor, color = colores.texto }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <View>
      <Text style={estilos.cifraEtiqueta}>{etiqueta}</Text>
      <Text style={[estilos.cifraValor, { color }]} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.tarjeta, borderRadius: radio.xl, padding: espacio.xl, marginBottom: espacio.lg, ...sombra },
  progreso: { flexDirection: 'row', alignItems: 'center', gap: espacio.xl, flexWrap: 'wrap', justifyContent: 'center' },
  porcentaje: { fontSize: 28, fontWeight: '800', color: colores.primario },
  porcentajeEtiqueta: { fontSize: 12, color: colores.textoSuave },
  cifras: { gap: espacio.md, flexGrow: 1, minWidth: 140 },
  cifraEtiqueta: { fontSize: 12, color: colores.textoSuave, fontWeight: '600' },
  cifraValor: { fontSize: 18, fontWeight: '800' },
  descripcion: { fontSize: 14, color: colores.textoSuave, marginTop: espacio.lg, lineHeight: 20 },
  estimacion: {
    flexDirection: 'row',
    gap: espacio.md,
    backgroundColor: colores.infoSuave,
    borderRadius: radio.lg,
    padding: espacio.lg,
    marginBottom: espacio.lg,
  },
  estimacionIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colores.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimacionTitulo: { fontSize: 16, fontWeight: '800', color: colores.texto },
  estimacionTexto: { fontSize: 14, color: colores.textoSuave, marginTop: 2, lineHeight: 20 },
  seccion: { fontSize: 17, fontWeight: '800', color: colores.texto, marginTop: espacio.sm, marginBottom: espacio.md },
  vacio: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: espacio.xl, alignItems: 'center' },
  vacioTexto: { fontSize: 14, color: colores.textoSuave, textAlign: 'center' },
  lista: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: espacio.xs, ...sombra },
  aporte: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, padding: espacio.md },
  aporteIcono: {
    width: 38,
    height: 38,
    borderRadius: radio.md,
    backgroundColor: colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aporteTitulo: { fontSize: 15, fontWeight: '700', color: colores.texto },
  aporteDetalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
  aporteValor: { fontSize: 15, fontWeight: '800', color: colores.ingreso },
});
