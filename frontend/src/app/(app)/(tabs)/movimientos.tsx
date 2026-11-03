import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aviso } from '@/components/Aviso';
import { EstadoVacio } from '@/components/EstadoVacio';
import { ItemMovimiento, type Movimiento } from '@/components/ItemMovimiento';
import { Segmentado } from '@/components/Opciones';
import { Pantalla } from '@/components/Pantalla';
import { SelectorMes } from '@/components/SelectorMes';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import { fechaTitulo, mesActual, moneda, nombreMes } from '@/lib/formato';
import { rutaEdicion } from '@/lib/rutas';
import type { Gasto, Ingreso } from '@/lib/tipos';
import { colores, espacio, radio, sombra } from '@/theme';

type Filtro = 'todos' | 'ingresos' | 'fijos' | 'variables';

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'ingresos', etiqueta: 'Ingresos' },
  { valor: 'fijos', etiqueta: 'Fijos' },
  { valor: 'variables', etiqueta: 'Variables' },
];

const NUEVOS: { titulo: string; detalle: string; icono: 'arrow-down-circle' | 'repeat' | 'cart'; color: string; fondo: string; ruta: Href }[] = [
  { titulo: 'Ingreso', detalle: 'Salario, honorarios, ventas…', icono: 'arrow-down-circle', color: colores.ingreso, fondo: colores.ingresoSuave, ruta: '/ingreso' },
  { titulo: 'Gasto fijo', detalle: 'Arriendo, servicios, transporte…', icono: 'repeat', color: '#7C3AED', fondo: '#EDE9FE', ruta: { pathname: '/gasto', params: { tipo: 'fijo' } } },
  { titulo: 'Gasto variable', detalle: 'Mercado, salidas, domicilios…', icono: 'cart', color: colores.gasto, fondo: colores.gastoSuave, ruta: { pathname: '/gasto', params: { tipo: 'variable' } } },
];

// HU-06 (CA-12) y HU-08: lista de movimientos del mes; al tocar uno se edita o elimina.
export default function Movimientos() {
  const [mes, setMes] = useState(mesActual());
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { bottom } = useSafeAreaInsets();

  const { datos, error, cargando, refrescando, recargar } = useDatos(async () => {
    const [ingresos, gastos] = await Promise.all([
      api.get<Ingreso[]>(`/ingresos?mes=${mes}`),
      api.get<Gasto[]>(`/gastos?mes=${mes}`),
    ]);
    return { ingresos, gastos };
  }, mes);

  const { grupos, total } = useMemo(() => {
    if (!datos) return { grupos: [] as [string, Movimiento[]][], total: 0 };
    const lista: Movimiento[] = [
      ...(filtro === 'todos' || filtro === 'ingresos' ? datos.ingresos.map((i) => ({ ...i, clase: 'ingreso' as const })) : []),
      ...datos.gastos
        .filter((g) => filtro === 'todos' || (filtro === 'fijos' && g.tipo === 'fijo') || (filtro === 'variables' && g.tipo === 'variable'))
        .map((g) => ({ ...g, clase: 'gasto' as const })),
    ].sort((a, b) => (a.fecha === b.fecha ? b.id - a.id : b.fecha.localeCompare(a.fecha)));

    const porFecha = new Map<string, Movimiento[]>();
    for (const m of lista) porFecha.set(m.fecha, [...(porFecha.get(m.fecha) ?? []), m]);
    const suma = lista.reduce((acc, m) => acc + (m.clase === 'ingreso' ? m.valor : -m.valor), 0);
    return { grupos: [...porFecha.entries()], total: suma };
  }, [datos, filtro]);

  const totalIngresos = datos?.ingresos.reduce((a, i) => a + i.valor, 0) ?? 0;
  const totalGastos = datos?.gastos.reduce((a, g) => a + g.valor, 0) ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <Pantalla refrescando={refrescando} alRefrescar={recargar}>
        <View style={estilos.cabecera}>
          <Text style={estilos.titulo}>Movimientos</Text>
          <SelectorMes mes={mes} alCambiar={setMes} />
        </View>

        <View style={estilos.totales}>
          <View style={[estilos.total, { backgroundColor: colores.ingresoSuave }]}>
            <Text style={estilos.totalEtiqueta}>Ingresos</Text>
            <Text style={[estilos.totalValor, { color: colores.ingreso }]} numberOfLines={1} adjustsFontSizeToFit>
              {moneda(totalIngresos)}
            </Text>
          </View>
          <View style={[estilos.total, { backgroundColor: colores.gastoSuave }]}>
            <Text style={estilos.totalEtiqueta}>Gastos</Text>
            <Text style={[estilos.totalValor, { color: colores.gasto }]} numberOfLines={1} adjustsFontSizeToFit>
              {moneda(totalGastos)}
            </Text>
          </View>
        </View>

        <Segmentado opciones={FILTROS} valor={filtro} alCambiar={setFiltro} />

        {error ? <Aviso mensaje={error} estilo={{ marginTop: espacio.lg }} /> : null}

        {cargando && !datos ? (
          <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
        ) : grupos.length === 0 ? (
          <View style={{ marginTop: espacio.lg }}>
            <EstadoVacio
              icono="receipt-outline"
              titulo="No hay movimientos"
              mensaje={`No tienes ${filtro === 'todos' ? 'movimientos' : filtro === 'ingresos' ? 'ingresos' : `gastos ${filtro}`} registrados en ${nombreMes(mes).toLowerCase()}.`}
              accion={{ titulo: 'Registrar movimiento', onPress: () => setMenuAbierto(true) }}
            />
          </View>
        ) : (
          <>
            {filtro !== 'todos' ? (
              <Text style={estilos.subtotal}>
                Total {FILTROS.find((f) => f.valor === filtro)?.etiqueta.toLowerCase()}: {moneda(Math.abs(total))}
              </Text>
            ) : null}
            {grupos.map(([fecha, lista]) => (
              <View key={fecha} style={estilos.grupo}>
                <Text style={estilos.grupoTitulo}>{fechaTitulo(fecha)}</Text>
                <View style={estilos.tarjeta}>
                  {lista.map((m) => (
                    <ItemMovimiento key={`${m.clase}-${m.id}`} movimiento={m} onPress={() => router.push(rutaEdicion(m))} />
                  ))}
                </View>
              </View>
            ))}
            <View style={{ height: 72 }} />
          </>
        )}
      </Pantalla>

      <Pressable
        onPress={() => setMenuAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel="Registrar un movimiento"
        style={({ pressed }) => [estilos.fab, { bottom: espacio.xl }, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        <Ionicons name="add" size={30} color={colores.blanco} />
      </Pressable>

      <Modal visible={menuAbierto} transparent animationType="slide" onRequestClose={() => setMenuAbierto(false)}>
        <Pressable style={estilos.fondoMenu} onPress={() => setMenuAbierto(false)}>
          <Pressable style={[estilos.menu, { paddingBottom: espacio.xl + bottom }]} onPress={() => {}}>
            <View style={estilos.agarre} />
            <Text style={estilos.menuTitulo}>¿Qué quieres registrar?</Text>
            {NUEVOS.map((n) => (
              <Pressable
                key={n.titulo}
                onPress={() => {
                  setMenuAbierto(false);
                  router.push(n.ruta);
                }}
                style={({ pressed }) => [estilos.menuItem, pressed && { backgroundColor: colores.fondo }]}
              >
                <View style={[estilos.menuIcono, { backgroundColor: n.fondo }]}>
                  <Ionicons name={n.icono} size={22} color={n.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.menuItemTitulo}>{n.titulo}</Text>
                  <Text style={estilos.menuItemDetalle}>{n.detalle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colores.textoTenue} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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
  totales: { flexDirection: 'row', gap: espacio.md, marginBottom: espacio.lg },
  total: { flex: 1, borderRadius: radio.lg, padding: espacio.lg },
  totalEtiqueta: { fontSize: 13, color: colores.textoSuave, fontWeight: '600' },
  totalValor: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  subtotal: { fontSize: 14, fontWeight: '700', color: colores.textoSuave, marginTop: espacio.lg },
  grupo: { marginTop: espacio.lg },
  grupoTitulo: { fontSize: 13, fontWeight: '700', color: colores.textoSuave, marginBottom: espacio.sm, marginLeft: 4 },
  tarjeta: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: espacio.xs, ...sombra },
  fab: {
    position: 'absolute',
    right: espacio.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
  fondoMenu: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  menu: {
    backgroundColor: colores.tarjeta,
    borderTopLeftRadius: radio.xl,
    borderTopRightRadius: radio.xl,
    padding: espacio.xl,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  agarre: { width: 40, height: 4, borderRadius: 2, backgroundColor: colores.borde, alignSelf: 'center', marginBottom: espacio.lg },
  menuTitulo: { fontSize: 18, fontWeight: '800', color: colores.texto, marginBottom: espacio.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, padding: espacio.md, borderRadius: radio.md },
  menuIcono: { width: 46, height: 46, borderRadius: radio.md, alignItems: 'center', justifyContent: 'center' },
  menuItemTitulo: { fontSize: 16, fontWeight: '700', color: colores.texto },
  menuItemDetalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
});
