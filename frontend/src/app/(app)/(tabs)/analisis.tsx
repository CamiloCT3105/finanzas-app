import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { BarraProgreso } from '@/components/BarraProgreso';
import { EstadoVacio } from '@/components/EstadoVacio';
import { BarrasVerticales, Dona, Leyenda } from '@/components/Graficas';
import { Pantalla } from '@/components/Pantalla';
import { SelectorMes } from '@/components/SelectorMes';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import { estiloCategoria } from '@/lib/categorias';
import { mesActual, mesCorto, moneda, monedaCorta, nombreMes, porcentaje } from '@/lib/formato';
import type { Comparacion, ResumenMensual } from '@/lib/tipos';
import { colores, espacio, radio, sombra } from '@/theme';

// HU-10, HU-12, HU-13 y HU-14: análisis financiero de un mes.
export default function Analisis() {
  const [mes, setMes] = useState(mesActual());
  const { width } = useWindowDimensions();
  const { datos, error, cargando, refrescando, recargar } = useDatos(async () => {
    const [resumen, comparacion] = await Promise.all([
      api.get<ResumenMensual>(`/resumen/mensual?mes=${mes}`),
      api.get<Comparacion>(`/resumen/comparacion?mes=${mes}`),
    ]);
    return { resumen, comparacion };
  }, mes);

  const r = datos?.resumen;
  const c = datos?.comparacion;
  const anchoDona = width < 400 ? 170 : 200;

  return (
    <Pantalla refrescando={refrescando} alRefrescar={recargar}>
      <View style={estilos.cabecera}>
        <Text style={estilos.titulo}>Análisis</Text>
        <SelectorMes mes={mes} alCambiar={setMes} />
      </View>

      {error ? <Aviso mensaje={error} /> : null}

      {cargando && !datos ? (
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
      ) : r && c ? (
        r.sinDatos ? (
          // CA-24: mes sin registros
          <EstadoVacio
            icono="calendar-outline"
            titulo={`No hay información para ${nombreMes(mes).toLowerCase()}`}
            mensaje="No registraste ingresos, gastos ni ahorros en este mes. Elige otro mes o registra tus movimientos."
            {...(mes === mesActual() ? { accion: { titulo: 'Registrar un ingreso', onPress: () => router.push('/ingreso') } } : {})}
          />
        ) : (
          <>
            {/* HU-10: capacidad de ahorro (CA-19, CA-20) */}
            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>Capacidad de ahorro</Text>
              {r.capacidad.porcentaje === null ? (
                <Aviso tipo="info" mensaje={r.capacidad.mensaje ?? ''} estilo={{ marginBottom: 0 }} />
              ) : (
                <>
                  <View style={estilos.capacidad}>
                    <Text
                      style={[estilos.capacidadValor, { color: r.capacidad.porcentaje < 0 ? colores.gasto : colores.primario }]}
                    >
                      {porcentaje(r.capacidad.porcentaje)}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.capacidadTexto}>de tu ingreso puedes ahorrar</Text>
                      <Text style={estilos.capacidadMonto}>{moneda(r.capacidad.valor)} este mes</Text>
                    </View>
                  </View>
                  <View style={estilos.medidor}>
                    <BarraProgreso
                      porcentaje={Math.max(0, r.capacidad.porcentaje)}
                      color={r.capacidad.porcentaje >= 20 ? colores.ingreso : r.capacidad.porcentaje >= 10 ? colores.advertencia : colores.gasto}
                      alto={10}
                    />
                    <View style={[estilos.marcaMeta, { left: '20%' }]} />
                  </View>
                  <Text style={estilos.nota}>{r.capacidad.mensaje}</Text>
                  <Text style={estilos.formula}>
                    ({moneda(r.ingresos)} − {moneda(r.gastos)}) ÷ {moneda(r.ingresos)} × 100
                  </Text>
                </>
              )}
            </View>

            {/* HU-12: resumen del mes (CA-23) */}
            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>Resumen de {nombreMes(mes).toLowerCase()}</Text>
              <View style={estilos.grilla}>
                <Dato etiqueta="Ingresos" valor={moneda(r.ingresos)} color={colores.ingreso} icono="arrow-down-circle" />
                <Dato etiqueta="Gastos" valor={moneda(r.gastos)} color={colores.gasto} icono="arrow-up-circle" />
                <Dato
                  etiqueta="Disponible"
                  valor={moneda(r.disponible)}
                  color={r.disponible < 0 ? colores.gasto : colores.texto}
                  icono="wallet"
                />
                <Dato etiqueta="Ahorrado en metas" valor={moneda(r.ahorro)} color={colores.primario} icono="flag" />
              </View>
              {r.metas.length > 0 ? (
                <View style={estilos.metas}>
                  <Text style={estilos.subtitulo}>Avance de metas en el mes</Text>
                  {r.metas.map((m) => (
                    <View key={m.id} style={{ gap: 4 }}>
                      <View style={estilos.filaEntre}>
                        <Text style={estilos.metaNombre} numberOfLines={1}>
                          {m.nombre}
                        </Text>
                        <Text style={estilos.metaAporte}>+{moneda(m.aportado_mes)}</Text>
                      </View>
                      <BarraProgreso porcentaje={m.porcentaje} alto={6} />
                      <Text style={estilos.metaDetalle}>
                        {m.porcentaje} % · {moneda(m.valor_ahorrado)} de {moneda(m.valor_objetivo)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* HU-13: gráfica de gastos por categoría (CA-25, CA-26) */}
            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>Gastos por categoría</Text>
              {r.categorias.length === 0 ? (
                <View style={estilos.vacio}>
                  <Ionicons name="pie-chart-outline" size={28} color={colores.textoTenue} />
                  <Text style={estilos.vacioTexto}>No hay gastos para mostrar en este mes.</Text>
                </View>
              ) : (
                <>
                  <View style={estilos.donaContenedor}>
                    <Dona
                      tamano={anchoDona}
                      datos={r.categorias.map((cat) => ({
                        valor: cat.total,
                        color: estiloCategoria(cat.categoria).color,
                        etiqueta: cat.categoria,
                      }))}
                      centro={
                        <>
                          <Text style={estilos.donaEtiqueta}>Total</Text>
                          <Text style={estilos.donaValor}>{monedaCorta(r.gastos)}</Text>
                        </>
                      }
                    />
                  </View>
                  <Leyenda
                    items={r.categorias.map((cat) => ({
                      color: estiloCategoria(cat.categoria).color,
                      etiqueta: cat.categoria,
                      detalle: porcentaje(cat.porcentaje),
                      valor: moneda(cat.total),
                    }))}
                  />
                  <Text style={[estilos.nota, { marginTop: espacio.md }]}>
                    Tu mayor gasto es <Text style={{ fontWeight: '800' }}>{r.categorias[0]!.categoria}</Text> con el{' '}
                    {porcentaje(r.categorias[0]!.porcentaje)} del total.
                  </Text>
                </>
              )}
            </View>

            {/* HU-14: comparación con el mes anterior (CA-27, CA-28) */}
            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>Comparación con el mes anterior</Text>
              {c.sinAnterior ? (
                <Aviso tipo="info" mensaje={c.mensaje ?? 'No hay un mes anterior para comparar.'} estilo={{ marginBottom: 0 }} />
              ) : (
                <>
                  <IndicadorTendencia comparacion={c} />
                  <BarrasVerticales
                    alto={150}
                    datos={[
                      { etiqueta: mesCorto(c.mesAnterior), valor: c.gastosAnterior, color: '#94A3B8', texto: monedaCorta(c.gastosAnterior) },
                      {
                        etiqueta: mesCorto(c.mes),
                        valor: c.gastosActual,
                        color: c.tendencia === 'aumento' ? colores.gasto : colores.ingreso,
                        texto: monedaCorta(c.gastosActual),
                      },
                    ]}
                  />
                </>
              )}
            </View>
          </>
        )
      ) : null}
    </Pantalla>
  );
}

function IndicadorTendencia({ comparacion: c }: { comparacion: Comparacion }) {
  const aumento = c.tendencia === 'aumento';
  const igual = c.tendencia === 'igual';
  const color = igual ? colores.textoSuave : aumento ? colores.gasto : colores.ingreso;
  const fondo = igual ? colores.fondo : aumento ? colores.gastoSuave : colores.ingresoSuave;
  return (
    <View style={[estilos.tendencia, { backgroundColor: fondo }]}>
      <Ionicons name={igual ? 'remove' : aumento ? 'trending-up' : 'trending-down'} size={26} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[estilos.tendenciaTitulo, { color }]}>
          {igual
            ? 'Gastaste lo mismo'
            : `${aumento ? 'Aumento' : 'Disminución'} de ${moneda(Math.abs(c.diferencia ?? 0))} (${porcentaje(Math.abs(c.porcentaje ?? 0))})`}
        </Text>
        <Text style={estilos.tendenciaTexto}>
          {aumento
            ? 'Este mes gastaste más que el mes anterior.'
            : igual
              ? 'Tus gastos no cambiaron respecto al mes anterior.'
              : '¡Bien! Este mes gastaste menos que el mes anterior.'}
        </Text>
      </View>
    </View>
  );
}

function Dato({ etiqueta, valor, color, icono }: { etiqueta: string; valor: string; color: string; icono: 'arrow-down-circle' | 'arrow-up-circle' | 'wallet' | 'flag' }) {
  return (
    <View style={estilos.dato}>
      <Ionicons name={icono} size={18} color={color} />
      <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
      <Text style={[estilos.datoValor, { color }]} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espacio.md,
    marginBottom: espacio.lg,
  },
  titulo: { fontSize: 26, fontWeight: '800', color: colores.texto },
  tarjeta: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: espacio.lg, marginBottom: espacio.lg, ...sombra },
  tarjetaTitulo: { fontSize: 17, fontWeight: '800', color: colores.texto, marginBottom: espacio.md },
  subtitulo: { fontSize: 14, fontWeight: '700', color: colores.textoSuave },
  capacidad: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, marginBottom: espacio.md },
  capacidadValor: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  capacidadTexto: { fontSize: 14, color: colores.textoSuave },
  capacidadMonto: { fontSize: 17, fontWeight: '800', color: colores.texto },
  medidor: { position: 'relative', justifyContent: 'center' },
  marcaMeta: { position: 'absolute', width: 2, height: 16, backgroundColor: colores.texto, opacity: 0.4 },
  nota: { fontSize: 13, color: colores.textoSuave, marginTop: espacio.sm, lineHeight: 19 },
  formula: { fontSize: 12, color: colores.textoTenue, marginTop: espacio.xs },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.sm },
  dato: { flexBasis: '48%', flexGrow: 1, backgroundColor: colores.fondo, borderRadius: radio.md, padding: espacio.md, gap: 2 },
  datoEtiqueta: { fontSize: 12, color: colores.textoSuave, fontWeight: '600', marginTop: 4 },
  datoValor: { fontSize: 17, fontWeight: '800' },
  metas: { marginTop: espacio.lg, gap: espacio.md },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', gap: espacio.sm },
  metaNombre: { flex: 1, fontSize: 14, fontWeight: '700', color: colores.texto },
  metaAporte: { fontSize: 14, fontWeight: '800', color: colores.ingreso },
  metaDetalle: { fontSize: 12, color: colores.textoSuave },
  donaContenedor: { alignItems: 'center', marginBottom: espacio.lg },
  donaEtiqueta: { fontSize: 12, color: colores.textoSuave },
  donaValor: { fontSize: 20, fontWeight: '800', color: colores.texto },
  vacio: { alignItems: 'center', gap: espacio.sm, paddingVertical: espacio.lg },
  vacioTexto: { fontSize: 14, color: colores.textoSuave, textAlign: 'center' },
  tendencia: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, borderRadius: radio.md, padding: espacio.md, marginBottom: espacio.lg },
  tendenciaTitulo: { fontSize: 15, fontWeight: '800' },
  tendenciaTexto: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
});
