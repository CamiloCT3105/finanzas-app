import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { BarraProgreso } from '@/components/BarraProgreso';
import { Boton } from '@/components/Boton';
import { Dialogo } from '@/components/Dialogo';
import { Pantalla } from '@/components/Pantalla';
import { useCelebraciones } from '@/context/celebraciones';
import { useDatos } from '@/hooks/useDatos';
import { api, mensajeError } from '@/lib/api';
import { fechaCorta, moneda } from '@/lib/formato';
import type { EstadoRetoUsuario, Logro, LogroUsuario, Racha, Reto, RetosUsuario, RetoUsuario } from '@/lib/tipos';
import { colores, espacio, radio, sombra } from '@/theme';

const DIAS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const NARANJA = '#EA580C';

const ESTADOS: Record<Exclude<EstadoRetoUsuario, 'activo'>, { texto: string; color: string; fondo: string; icono: ComponentProps<typeof Ionicons>['name'] }> = {
  cumplido: { texto: 'Cumplido', color: '#15803D', fondo: '#DCFCE7', icono: 'checkmark-circle' },
  no_cumplido: { texto: 'No cumplido', color: '#B91C1C', fondo: '#FEE2E2', icono: 'close-circle' },
  abandonado: { texto: 'Abandonado', color: '#475569', fondo: '#E2E8F0', icono: 'remove-circle' },
};

// HU-19 a HU-23: retos de ahorro, racha y logros.
export default function Retos() {
  const { celebrar, celebrarLogros } = useCelebraciones();
  const { datos, error, cargando, refrescando, recargar } = useDatos(async () => {
    const [retos, racha, logros] = await Promise.all([
      api.get<RetosUsuario>('/retos'),
      api.get<Racha>('/motivacion/racha'),
      api.get<LogroUsuario[]>('/motivacion/logros'),
    ]);
    return { retos, racha, logros };
  });
  const [accion, setAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'exito'; texto: string } | null>(null);
  const [confirmarAbandono, setConfirmarAbandono] = useState(false);

  const ejecutar = async (clave: string, fn: () => Promise<void>) => {
    setAccion(clave);
    setAviso(null);
    try {
      await fn();
      await recargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: mensajeError(e) });
    } finally {
      setAccion(null);
    }
  };

  // CA-38: iniciar un reto
  const iniciar = (reto: Reto) =>
    ejecutar(`iniciar-${reto.id}`, async () => {
      const activo = await api.post<RetoUsuario>(`/retos/${reto.id}/iniciar`);
      celebrar([
        {
          titulo: '¡Reto iniciado!',
          mensaje: `"${activo.nombre}": tienes ${activo.dias_restantes} ${activo.dias_restantes === 1 ? 'día' : 'días'} para ahorrar ${moneda(activo.objetivo)}.`,
          icono: 'rocket',
          etiqueta: 'Nuevo reto',
        },
      ]);
    });

  // CA-41: marcar el reto como cumplido
  const completar = () =>
    ejecutar('completar', async () => {
      const r = await api.post<{ reto: RetoUsuario; logros: Logro[] }>('/retos/activo/completar');
      celebrar([
        {
          titulo: '¡Reto cumplido! 🎉',
          mensaje: `Lograste "${r.reto.nombre}" el ${fechaCorta(r.reto.fecha_cumplimiento!)}. Lo ahorrado ya está en tu meta.`,
          icono: 'medal',
          etiqueta: 'Felicitaciones',
        },
      ]);
      celebrarLogros(r.logros);
    });

  const abandonar = () =>
    ejecutar('abandonar', async () => {
      setConfirmarAbandono(false);
      await api.post('/retos/activo/abandonar');
      setAviso({ tipo: 'exito', texto: 'Abandonaste el reto. Puedes elegir otro cuando quieras.' });
    });

  const retos = datos?.retos;
  const racha = datos?.racha;
  const activo = retos?.activo ?? null;

  return (
    <Pantalla refrescando={refrescando} alRefrescar={recargar}>
      <Text style={estilos.titulo}>Retos y logros</Text>
      <Text style={estilos.subtituloPantalla}>Pequeños objetivos que te motivan a ahorrar.</Text>

      {error ? <Aviso mensaje={error} /> : null}
      {aviso ? <Aviso tipo={aviso.tipo} mensaje={aviso.texto} /> : null}

      {cargando && !datos ? (
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
      ) : retos && racha && datos ? (
        <>
          {/* HU-22: racha de ahorro (CA-43, CA-44) */}
          <View style={[estilos.tarjeta, estilos.racha]}>
            <View style={estilos.rachaCabecera}>
              <View style={estilos.rachaIcono}>
                <Ionicons name="flame" size={32} color={racha.actual > 0 ? NARANJA : colores.textoTenue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.rachaValor}>
                  {racha.actual} {racha.actual === 1 ? 'día' : 'días'}
                </Text>
                <Text style={estilos.rachaTexto}>
                  {racha.actual > 0 ? 'seguidos ahorrando' : 'Tu racha está en cero'} · Mejor racha: {racha.mejor}
                </Text>
              </View>
            </View>
            <View style={estilos.dias}>
              {racha.ultimosDias.map((d) => {
                const [a, m, dd] = d.fecha.split('-').map(Number) as [number, number, number];
                return (
                  <View key={d.fecha} style={estilos.dia}>
                    <View style={[estilos.diaPunto, d.ahorro && estilos.diaPuntoActivo]}>
                      {d.ahorro ? <Ionicons name="checkmark" size={14} color={colores.blanco} /> : null}
                    </View>
                    <Text style={estilos.diaTexto}>{DIAS[new Date(a, m - 1, dd).getDay()]}</Text>
                  </View>
                );
              })}
            </View>
            {!racha.ahorroHoy ? (
              <Text style={estilos.rachaNota}>
                {racha.actual > 0
                  ? 'Registra un ahorro o un gasto evitado hoy para mantener tu racha.'
                  : 'Registra un ahorro o un gasto evitado para empezar una racha.'}
              </Text>
            ) : (
              <Text style={[estilos.rachaNota, { color: '#15803D' }]}>¡Ya ahorraste hoy! Vuelve mañana para seguir sumando.</Text>
            )}
            <Boton titulo="Registrar gasto evitado" icono="shield-checkmark-outline" variante="secundario" onPress={() => router.push('/gasto-evitado')} />
          </View>

          {/* HU-19 / HU-21: reto activo */}
          {activo ? (
            <View style={[estilos.tarjeta, estilos.activo]}>
              <View style={estilos.etiquetaActivo}>
                <Ionicons name="time" size={14} color={NARANJA} />
                <Text style={estilos.etiquetaActivoTexto}>
                  Reto activo · {activo.dias_restantes} {activo.dias_restantes === 1 ? 'día restante' : 'días restantes'}
                </Text>
              </View>
              <Text style={estilos.retoNombre}>{activo.nombre}</Text>
              <Text style={estilos.retoDescripcion}>{activo.descripcion}</Text>
              <BarraProgreso porcentaje={(activo.ahorrado / activo.objetivo) * 100} color={NARANJA} alto={10} />
              <View style={estilos.filaEntre}>
                <Text style={estilos.retoMonto}>
                  {moneda(activo.ahorrado)} <Text style={estilos.retoMontoDe}>de {moneda(activo.objetivo)}</Text>
                </Text>
                <Text style={estilos.retoFin}>Termina el {fechaCorta(activo.fecha_fin)}</Text>
              </View>
              <View style={estilos.botones}>
                <Boton titulo="Registrar avance" icono="add" onPress={() => router.push('/avance-reto')} estilo={{ flex: 1 }} />
                <Boton
                  titulo="Completar"
                  icono="checkmark-done"
                  variante="secundario"
                  onPress={completar}
                  cargando={accion === 'completar'}
                  estilo={{ flex: 1 }}
                />
              </View>
              <Boton titulo="Abandonar reto" variante="fantasma" onPress={() => setConfirmarAbandono(true)} cargando={accion === 'abandonar'} />
            </View>
          ) : null}

          {/* HU-19 (CA-37): retos disponibles */}
          <Text style={estilos.seccion}>Retos disponibles</Text>
          {activo ? <Text style={estilos.notaSeccion}>Termina tu reto activo para iniciar otro.</Text> : null}
          {retos.disponibles.map((r) => (
            <View key={r.id} style={[estilos.tarjeta, estilos.reto]}>
              <View style={estilos.retoCabecera}>
                <View style={estilos.retoIcono}>
                  <Ionicons name="trophy-outline" size={22} color={NARANJA} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.retoNombre}>{r.nombre}</Text>
                  <Text style={estilos.retoDescripcion}>{r.descripcion}</Text>
                </View>
              </View>
              <View style={estilos.chips}>
                <Chip icono="cash-outline" texto={`Objetivo ${moneda(r.objetivo)}`} />
                <Chip icono="calendar-outline" texto={`${r.duracion_dias} ${r.duracion_dias === 1 ? 'día' : 'días'}`} />
              </View>
              {r.condiciones ? <Text style={estilos.condiciones}>{r.condiciones}</Text> : null}
              <Boton
                titulo="Iniciar reto"
                icono="rocket-outline"
                variante={activo ? 'secundario' : 'primario'}
                deshabilitado={!!activo}
                cargando={accion === `iniciar-${r.id}`}
                onPress={() => iniciar(r)}
              />
            </View>
          ))}

          {/* CA-41 / CA-42: historial con retos cumplidos y no cumplidos */}
          {retos.historial.length > 0 ? (
            <>
              <Text style={estilos.seccion}>Historial</Text>
              <View style={[estilos.tarjeta, { padding: espacio.xs }]}>
                {retos.historial.map((h) => {
                  const e = ESTADOS[h.estado as keyof typeof ESTADOS];
                  return (
                    <View key={h.id} style={estilos.historial}>
                      <Ionicons name={e.icono} size={22} color={e.color} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={estilos.historialNombre} numberOfLines={1}>
                          {h.nombre}
                        </Text>
                        <Text style={estilos.historialDetalle}>
                          {fechaCorta(h.fecha_inicio)} – {fechaCorta(h.fecha_fin)} · {moneda(h.ahorrado)} ahorrados
                        </Text>
                      </View>
                      <View style={[estilos.estado, { backgroundColor: e.fondo }]}>
                        <Text style={[estilos.estadoTexto, { color: e.color }]}>{e.texto}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          {/* HU-23: logros */}
          <Text style={estilos.seccion}>
            Logros · {datos.logros.filter((l) => l.obtenido).length} de {datos.logros.length}
          </Text>
          <View style={estilos.logros}>
            {datos.logros.map((l) => (
              <View key={l.codigo} style={[estilos.logro, !l.obtenido && estilos.logroBloqueado]} accessibilityLabel={`${l.nombre}: ${l.obtenido ? 'obtenido' : 'por obtener'}`}>
                <View style={[estilos.logroIcono, { backgroundColor: l.obtenido ? '#FEF3C7' : colores.fondo }]}>
                  <Ionicons
                    name={(l.obtenido ? l.icono : 'lock-closed') as ComponentProps<typeof Ionicons>['name']}
                    size={24}
                    color={l.obtenido ? '#D97706' : colores.textoTenue}
                  />
                </View>
                <Text style={[estilos.logroNombre, !l.obtenido && { color: colores.textoSuave }]} numberOfLines={2}>
                  {l.nombre}
                </Text>
                <Text style={estilos.logroDetalle} numberOfLines={2}>
                  {l.obtenido && l.fecha ? fechaCorta(l.fecha) : l.condicion}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Dialogo
        visible={confirmarAbandono}
        titulo="¿Abandonar el reto?"
        mensaje="El reto quedará como abandonado. Lo que ya ahorraste se queda en tus metas."
        textoConfirmar="Abandonar"
        peligro
        icono="exit-outline"
        alCancelar={() => setConfirmarAbandono(false)}
        alConfirmar={abandonar}
      />
    </Pantalla>
  );
}

function Chip({ icono, texto }: { icono: ComponentProps<typeof Ionicons>['name']; texto: string }) {
  return (
    <View style={estilos.chip}>
      <Ionicons name={icono} size={14} color={colores.textoSuave} />
      <Text style={estilos.chipTexto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 26, fontWeight: '800', color: colores.texto },
  subtituloPantalla: { fontSize: 14, color: colores.textoSuave, marginTop: 2, marginBottom: espacio.lg },
  tarjeta: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: espacio.lg, marginBottom: espacio.md, ...sombra },
  racha: { gap: espacio.md },
  rachaCabecera: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
  rachaIcono: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center' },
  rachaValor: { fontSize: 26, fontWeight: '800', color: colores.texto },
  rachaTexto: { fontSize: 13, color: colores.textoSuave },
  dias: { flexDirection: 'row', justifyContent: 'space-between' },
  dia: { alignItems: 'center', gap: 4 },
  diaPunto: { width: 30, height: 30, borderRadius: 15, backgroundColor: colores.fondo, borderWidth: 1.5, borderColor: colores.borde, alignItems: 'center', justifyContent: 'center' },
  diaPuntoActivo: { backgroundColor: NARANJA, borderColor: NARANJA },
  diaTexto: { fontSize: 12, color: colores.textoSuave, fontWeight: '600' },
  rachaNota: { fontSize: 13, color: colores.textoSuave },
  activo: { borderWidth: 1.5, borderColor: '#FDBA74', gap: espacio.sm },
  etiquetaActivo: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#FFEDD5', borderRadius: radio.total, paddingHorizontal: espacio.sm, paddingVertical: 3 },
  etiquetaActivoTexto: { fontSize: 12, fontWeight: '700', color: NARANJA },
  retoNombre: { fontSize: 16, fontWeight: '800', color: colores.texto },
  retoDescripcion: { fontSize: 14, color: colores.textoSuave, marginTop: 2, lineHeight: 20 },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: espacio.sm },
  retoMonto: { fontSize: 16, fontWeight: '800', color: colores.texto },
  retoMontoDe: { fontSize: 13, fontWeight: '500', color: colores.textoSuave },
  retoFin: { fontSize: 12, color: colores.textoSuave },
  botones: { flexDirection: 'row', gap: espacio.md, marginTop: espacio.sm },
  seccion: { fontSize: 18, fontWeight: '800', color: colores.texto, marginTop: espacio.lg, marginBottom: espacio.sm },
  notaSeccion: { fontSize: 13, color: colores.textoSuave, marginBottom: espacio.sm },
  reto: { gap: espacio.md },
  retoCabecera: { flexDirection: 'row', gap: espacio.md },
  retoIcono: { width: 44, height: 44, borderRadius: radio.md, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colores.fondo, borderRadius: radio.total, paddingHorizontal: espacio.md, paddingVertical: 5 },
  chipTexto: { fontSize: 13, color: colores.textoSuave, fontWeight: '600' },
  condiciones: { fontSize: 13, color: colores.textoSuave, fontStyle: 'italic' },
  historial: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, padding: espacio.md },
  historialNombre: { fontSize: 15, fontWeight: '700', color: colores.texto },
  historialDetalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  estado: { borderRadius: radio.total, paddingHorizontal: espacio.sm, paddingVertical: 3 },
  estadoTexto: { fontSize: 12, fontWeight: '700' },
  logros: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.sm, marginBottom: espacio.lg },
  logro: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: colores.tarjeta,
    borderRadius: radio.lg,
    padding: espacio.md,
    alignItems: 'center',
    gap: 4,
    ...sombra,
  },
  logroBloqueado: { opacity: 0.75 },
  logroIcono: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  logroNombre: { fontSize: 13, fontWeight: '800', color: colores.texto, textAlign: 'center' },
  logroDetalle: { fontSize: 11, color: colores.textoSuave, textAlign: 'center' },
});
