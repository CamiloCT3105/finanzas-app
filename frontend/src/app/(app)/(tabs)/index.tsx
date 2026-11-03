import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { BarraProgreso } from '@/components/BarraProgreso';
import { EstadoVacio } from '@/components/EstadoVacio';
import { ItemMovimiento, type Movimiento } from '@/components/ItemMovimiento';
import { Pantalla } from '@/components/Pantalla';
import { SelectorMes } from '@/components/SelectorMes';
import { useSesion } from '@/context/sesion';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import { iniciales, mesActual, moneda, nombreMes } from '@/lib/formato';
import { rutaEdicion } from '@/lib/rutas';
import type { Gasto, Ingreso, ResumenDisponible } from '@/lib/tipos';
import { colores, degradadoNegativo, degradadoSaldo, espacio, radio, sombra } from '@/theme';

const ACCIONES: { titulo: string; icono: ComponentProps<typeof Ionicons>['name']; color: string; fondo: string; ruta: Href }[] = [
  { titulo: 'Ingreso', icono: 'arrow-down-circle', color: colores.ingreso, fondo: colores.ingresoSuave, ruta: '/ingreso' },
  { titulo: 'Gasto fijo', icono: 'repeat', color: '#7C3AED', fondo: '#EDE9FE', ruta: { pathname: '/gasto', params: { tipo: 'fijo' } } },
  { titulo: 'Gasto variable', icono: 'cart', color: colores.gasto, fondo: colores.gastoSuave, ruta: { pathname: '/gasto', params: { tipo: 'variable' } } },
  { titulo: 'Meta', icono: 'flag', color: colores.info, fondo: colores.infoSuave, ruta: '/meta' },
];

// HU-09: pantalla principal con el dinero disponible del mes.
export default function Inicio() {
  const { usuario } = useSesion();
  const { width } = useWindowDimensions();
  const [mes, setMes] = useState(mesActual());

  const { datos, error, cargando, refrescando, recargar } = useDatos(async () => {
    const [resumen, ingresos, gastos] = await Promise.all([
      api.get<ResumenDisponible>(`/resumen/disponible?mes=${mes}`),
      api.get<Ingreso[]>(`/ingresos?mes=${mes}`),
      api.get<Gasto[]>(`/gastos?mes=${mes}`),
    ]);
    const recientes: Movimiento[] = [
      ...ingresos.map((i) => ({ ...i, clase: 'ingreso' as const })),
      ...gastos.map((g) => ({ ...g, clase: 'gasto' as const })),
    ]
      .sort((a, b) => (a.fecha === b.fecha ? b.id - a.id : b.fecha.localeCompare(a.fecha)))
      .slice(0, 5);
    return { resumen, recientes };
  }, mes);

  const resumen = datos?.resumen;
  const negativo = !!resumen && resumen.disponible < 0;
  const tamanoSaldo = width < 360 ? 32 : width < 768 ? 38 : 44;
  const porcentajeGastado = resumen && resumen.ingresos > 0 ? (resumen.gastos / resumen.ingresos) * 100 : 0;

  return (
    <Pantalla refrescando={refrescando} alRefrescar={recargar}>
      <View style={estilos.saludo}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.hola}>Hola,</Text>
          <Text style={estilos.nombre} numberOfLines={1}>
            {usuario?.nombre.split(' ')[0]} 👋
          </Text>
        </View>
        <Pressable onPress={() => router.navigate('/perfil')} style={estilos.avatar} accessibilityLabel="Ir a mi perfil">
          <Text style={estilos.avatarTexto}>{iniciales(usuario?.nombre ?? '')}</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={negativo ? degradadoNegativo : degradadoSaldo}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.saldo}
      >
        <View style={estilos.saldoCabecera}>
          <Text style={estilos.saldoEtiqueta}>Dinero disponible</Text>
          <SelectorMes mes={mes} alCambiar={setMes} claro />
        </View>
        {cargando && !datos ? (
          <ActivityIndicator color={colores.blanco} style={{ marginVertical: espacio.xl }} />
        ) : (
          <Text
            style={[estilos.saldoValor, { fontSize: tamanoSaldo }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityLabel={`Dinero disponible: ${moneda(resumen?.disponible ?? 0)}`}
          >
            {moneda(resumen?.disponible ?? 0)}
          </Text>
        )}
        <View style={estilos.saldoFila}>
          <ResumenMini icono="arrow-down" etiqueta="Ingresos" valor={resumen?.ingresos ?? 0} />
          <View style={estilos.separador} />
          <ResumenMini icono="arrow-up" etiqueta="Gastos" valor={resumen?.gastos ?? 0} />
        </View>
      </LinearGradient>

      {error ? <Aviso mensaje={error} estilo={{ marginTop: espacio.lg }} /> : null}

      {/* CA-18: aviso cuando los gastos superan a los ingresos */}
      {negativo ? (
        <Aviso
          tipo="error"
          titulo="Gastaste más de lo que ingresaste"
          mensaje={`Este mes tus gastos superan tus ingresos por ${moneda(Math.abs(resumen!.disponible))}. Revisa tus gastos variables.`}
          estilo={{ marginTop: espacio.lg }}
        />
      ) : null}

      <View style={estilos.acciones}>
        {ACCIONES.map((accion) => (
          <Pressable
            key={accion.titulo}
            onPress={() => router.push(accion.ruta)}
            accessibilityRole="button"
            accessibilityLabel={`Registrar ${accion.titulo.toLowerCase()}`}
            style={({ pressed }) => [estilos.accion, pressed && { transform: [{ scale: 0.96 }] }]}
          >
            <View style={[estilos.accionIcono, { backgroundColor: accion.fondo }]}>
              <Ionicons name={accion.icono} size={24} color={accion.color} />
            </View>
            <Text style={estilos.accionTexto} numberOfLines={2}>
              {accion.titulo}
            </Text>
          </Pressable>
        ))}
      </View>

      {datos && resumen?.movimientos === 0 ? (
        <EstadoVacio
          icono="sparkles"
          titulo={mes === mesActual() ? 'Empieza registrando tu ingreso' : `Sin movimientos en ${nombreMes(mes).toLowerCase()}`}
          mensaje={
            mes === mesActual()
              ? 'Registra tu ingreso del mes y tus gastos para calcular cuánto dinero te queda disponible.'
              : 'No registraste ingresos ni gastos en este mes.'
          }
          {...(mes === mesActual() ? { accion: { titulo: 'Registrar mi ingreso', onPress: () => router.push('/ingreso') } } : {})}
        />
      ) : null}

      {resumen && resumen.movimientos > 0 ? (
        <>
          <View style={estilos.tarjeta}>
            <Text style={estilos.tarjetaTitulo}>¿En qué se fue tu dinero?</Text>
            <View style={estilos.desglose}>
              <Desglose color="#7C3AED" etiqueta="Gastos fijos" valor={resumen.gastosFijos} />
              <Desglose color={colores.gasto} etiqueta="Gastos variables" valor={resumen.gastosVariables} />
            </View>
            {resumen.ingresos > 0 ? (
              <>
                <BarraProgreso
                  porcentaje={porcentajeGastado}
                  color={porcentajeGastado > 100 ? colores.gasto : porcentajeGastado > 80 ? colores.advertencia : colores.primario}
                  alto={10}
                />
                <Text style={estilos.nota}>
                  Has usado el {Math.round(porcentajeGastado)} % de tus ingresos del mes.
                </Text>
              </>
            ) : (
              <Text style={estilos.nota}>Registra un ingreso para saber qué porcentaje has gastado.</Text>
            )}
          </View>

          <View style={estilos.tarjeta}>
            <View style={estilos.tarjetaCabecera}>
              <Text style={estilos.tarjetaTitulo}>Últimos movimientos</Text>
              <Pressable onPress={() => router.navigate('/movimientos')} hitSlop={8}>
                <Text style={estilos.verTodo}>Ver todos</Text>
              </Pressable>
            </View>
            {datos?.recientes.map((m) => (
              <ItemMovimiento
                key={`${m.clase}-${m.id}`}
                movimiento={m}
                mostrarFecha
                onPress={() => router.push(rutaEdicion(m))}
              />
            ))}
          </View>
        </>
      ) : null}
    </Pantalla>
  );
}

function ResumenMini({ icono, etiqueta, valor }: { icono: 'arrow-down' | 'arrow-up'; etiqueta: string; valor: number }) {
  return (
    <View style={estilos.mini}>
      <View style={estilos.miniIcono}>
        <Ionicons name={icono} size={14} color={colores.blanco} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={estilos.miniEtiqueta}>{etiqueta}</Text>
        <Text style={estilos.miniValor} numberOfLines={1} adjustsFontSizeToFit>
          {moneda(valor)}
        </Text>
      </View>
    </View>
  );
}

function Desglose({ color, etiqueta, valor }: { color: string; etiqueta: string; valor: number }) {
  return (
    <View style={estilos.desgloseItem}>
      <View style={[estilos.punto, { backgroundColor: color }]} />
      <View style={{ flexShrink: 1 }}>
        <Text style={estilos.desgloseEtiqueta}>{etiqueta}</Text>
        <Text style={estilos.desgloseValor} numberOfLines={1} adjustsFontSizeToFit>
          {moneda(valor)}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  saludo: { flexDirection: 'row', alignItems: 'center', marginBottom: espacio.lg },
  hola: { fontSize: 15, color: colores.textoSuave },
  nombre: { fontSize: 24, fontWeight: '800', color: colores.texto },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontSize: 16, fontWeight: '800', color: colores.primario },

  saldo: { borderRadius: radio.xl, padding: espacio.xl, ...sombra },
  saldoCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espacio.sm,
  },
  saldoEtiqueta: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  saldoValor: { color: colores.blanco, fontWeight: '800', marginVertical: espacio.lg, letterSpacing: -0.5 },
  saldoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radio.lg,
    padding: espacio.md,
  },
  separador: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: espacio.md },
  mini: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  miniIcono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniEtiqueta: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  miniValor: { color: colores.blanco, fontSize: 15, fontWeight: '700' },

  acciones: { flexDirection: 'row', gap: espacio.sm, marginVertical: espacio.xl },
  accion: { flex: 1, alignItems: 'center', gap: espacio.sm },
  accionIcono: {
    width: 56,
    height: 56,
    borderRadius: radio.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accionTexto: { fontSize: 12, fontWeight: '600', color: colores.texto, textAlign: 'center' },

  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radio.lg,
    padding: espacio.lg,
    marginBottom: espacio.lg,
    ...sombra,
  },
  tarjetaCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espacio.xs },
  tarjetaTitulo: { fontSize: 16, fontWeight: '800', color: colores.texto, marginBottom: espacio.md },
  verTodo: { color: colores.primario, fontWeight: '700', fontSize: 14, marginBottom: espacio.md },
  desglose: { flexDirection: 'row', gap: espacio.md, marginBottom: espacio.lg },
  desgloseItem: { flex: 1, flexDirection: 'row', gap: espacio.sm, alignItems: 'flex-start' },
  punto: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  desgloseEtiqueta: { fontSize: 13, color: colores.textoSuave },
  desgloseValor: { fontSize: 17, fontWeight: '800', color: colores.texto },
  nota: { fontSize: 13, color: colores.textoSuave, marginTop: espacio.sm },
});
