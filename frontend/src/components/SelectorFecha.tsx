import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { fechaCorta, fechaISO, hoyISO, nombreMesSolo } from '@/lib/formato';
import { colores, espacio, radio } from '@/theme';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface Props {
  etiqueta: string;
  valor: string | null;
  alCambiar: (fecha: string | null) => void;
  error?: string | undefined;
  opcional?: boolean;
  minima?: string;
}

/** Campo de fecha con un calendario propio (funciona igual en Android, iOS y web). */
export function SelectorFecha({ etiqueta, valor, alCambiar, error, opcional, minima }: Props) {
  const [abierto, setAbierto] = useState(false);
  const base = valor ?? hoyISO();
  const [anio, setAnio] = useState(Number(base.slice(0, 4)));
  const [mes, setMes] = useState(Number(base.slice(5, 7)) - 1);

  const abrir = () => {
    const ref = valor ?? hoyISO();
    setAnio(Number(ref.slice(0, 4)));
    setMes(Number(ref.slice(5, 7)) - 1);
    setAbierto(true);
  };

  const mover = (delta: number) => {
    const fecha = new Date(anio, mes + delta, 1);
    setAnio(fecha.getFullYear());
    setMes(fecha.getMonth());
  };

  // Celdas del mes empezando en lunes.
  const primerDia = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array<null>(primerDia).fill(null),
    ...Array.from({ length: diasMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7) celdas.push(null);
  const hoy = hoyISO();

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <Pressable
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={`${etiqueta}: ${valor ? fechaCorta(valor) : 'sin fecha'}`}
        style={[estilos.caja, error ? { borderColor: colores.gasto } : null]}
      >
        <Ionicons name="calendar-outline" size={20} color={colores.textoTenue} />
        <Text style={[estilos.valor, !valor && { color: colores.textoTenue }]}>
          {valor ? (valor === hoy ? `Hoy, ${fechaCorta(valor)}` : fechaCorta(valor)) : 'Sin fecha'}
        </Text>
        {opcional && valor ? (
          <Pressable onPress={() => alCambiar(null)} hitSlop={10} accessibilityLabel="Quitar fecha">
            <Ionicons name="close-circle" size={20} color={colores.textoTenue} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={18} color={colores.textoTenue} />
        )}
      </Pressable>
      {error ? <Text style={estilos.error}>{error}</Text> : null}

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={estilos.fondo} onPress={() => setAbierto(false)}>
          <Pressable style={estilos.calendario} onPress={() => {}}>
            <View style={estilos.cabecera}>
              <Pressable onPress={() => mover(-1)} hitSlop={10} accessibilityLabel="Mes anterior" style={estilos.flecha}>
                <Ionicons name="chevron-back" size={20} color={colores.texto} />
              </Pressable>
              <Text style={estilos.mes}>
                {nombreMesSolo(mes)} {anio}
              </Text>
              <Pressable onPress={() => mover(1)} hitSlop={10} accessibilityLabel="Mes siguiente" style={estilos.flecha}>
                <Ionicons name="chevron-forward" size={20} color={colores.texto} />
              </Pressable>
            </View>
            <View style={estilos.semana}>
              {DIAS.map((d) => (
                <Text key={d} style={estilos.diaSemana}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={estilos.grilla}>
              {celdas.map((dia, i) => {
                if (!dia) return <View key={i} style={estilos.celda} />;
                const iso = fechaISO(new Date(anio, mes, dia));
                const seleccionado = iso === valor;
                const deshabilitado = !!minima && iso < minima;
                return (
                  <Pressable
                    key={i}
                    disabled={deshabilitado}
                    onPress={() => {
                      alCambiar(iso);
                      setAbierto(false);
                    }}
                    style={estilos.celda}
                    accessibilityLabel={fechaCorta(iso)}
                  >
                    <View
                      style={[
                        estilos.dia,
                        iso === hoy && estilos.diaHoy,
                        seleccionado && estilos.diaSeleccionado,
                      ]}
                    >
                      <Text
                        style={[
                          estilos.diaTexto,
                          deshabilitado && { color: colores.borde },
                          seleccionado && { color: colores.blanco, fontWeight: '700' },
                        ]}
                      >
                        {dia}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={estilos.acciones}>
              {!minima || hoy >= minima ? (
                <Pressable
                  onPress={() => {
                    alCambiar(hoy);
                    setAbierto(false);
                  }}
                  style={estilos.accion}
                >
                  <Text style={estilos.accionTexto}>Hoy</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setAbierto(false)} style={estilos.accion}>
                <Text style={[estilos.accionTexto, { color: colores.textoSuave }]}>Cerrar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginBottom: espacio.lg },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginBottom: espacio.sm },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.sm,
    minHeight: 52,
    paddingHorizontal: espacio.md,
    borderRadius: radio.md,
    borderWidth: 1.5,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  valor: { flex: 1, fontSize: 16, color: colores.texto },
  error: { color: colores.gasto, fontSize: 13, marginTop: 6 },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacio.xl,
  },
  calendario: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colores.tarjeta,
    borderRadius: radio.xl,
    padding: espacio.lg,
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: espacio.md },
  flecha: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  mes: { fontSize: 17, fontWeight: '700', color: colores.texto },
  semana: { flexDirection: 'row' },
  diaSemana: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '600', color: colores.textoTenue, paddingVertical: 6 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap' },
  celda: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dia: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  diaHoy: { borderWidth: 1.5, borderColor: colores.acento },
  diaSeleccionado: { backgroundColor: colores.primario, borderColor: colores.primario },
  diaTexto: { fontSize: 15, color: colores.texto },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacio.sm, marginTop: espacio.sm },
  accion: { paddingHorizontal: espacio.md, paddingVertical: espacio.sm },
  accionTexto: { fontSize: 15, fontWeight: '700', color: colores.primario },
});
