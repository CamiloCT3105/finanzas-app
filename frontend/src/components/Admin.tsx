import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, espacio, radio, sombra } from '@/theme';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

/** Título de las pantallas del panel administrativo. */
export function EncabezadoAdmin({ titulo, subtitulo, accion }: { titulo: string; subtitulo?: string; accion?: ReactNode }) {
  return (
    <View style={estilos.encabezado}>
      <View style={{ flex: 1 }}>
        <View style={estilos.sello}>
          <Ionicons name="shield-checkmark" size={12} color={colores.primarioOscuro} />
          <Text style={estilos.selloTexto}>Panel administrativo</Text>
        </View>
        <Text style={estilos.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
      </View>
      {accion}
    </View>
  );
}

/** Etiqueta de estado (activo/inactivo, rol, estado de soporte). */
export function Insignia({ texto, color, fondo }: { texto: string; color: string; fondo: string }) {
  return (
    <View style={[estilos.insignia, { backgroundColor: fondo }]}>
      <Text style={[estilos.insigniaTexto, { color }]}>{texto}</Text>
    </View>
  );
}

export const insigniaEstado = (estado: 'activo' | 'inactivo') =>
  estado === 'activo'
    ? { texto: 'Activo', color: '#15803D', fondo: '#DCFCE7' }
    : { texto: 'Inactivo', color: '#B91C1C', fondo: '#FEE2E2' };

/** Tarjeta de indicador numérico. */
export function Indicador({
  etiqueta,
  valor,
  icono,
  color,
  fondo,
  detalle,
}: {
  etiqueta: string;
  valor: number | string;
  icono: NombreIcono;
  color: string;
  fondo: string;
  detalle?: string;
}) {
  return (
    <View style={estilos.indicador} accessibilityLabel={`${etiqueta}: ${valor}`}>
      <View style={[estilos.indicadorIcono, { backgroundColor: fondo }]}>
        <Ionicons name={icono} size={20} color={color} />
      </View>
      <Text style={estilos.indicadorValor}>{valor}</Text>
      <Text style={estilos.indicadorEtiqueta}>{etiqueta}</Text>
      {detalle ? <Text style={estilos.indicadorDetalle}>{detalle}</Text> : null}
    </View>
  );
}

/** Fila de menú con ícono que abre otra pantalla. */
export function OpcionMenu({ titulo, detalle, icono, onPress, contador }: { titulo: string; detalle: string; icono: NombreIcono; onPress: () => void; contador?: number }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [estilos.opcion, pressed && { backgroundColor: colores.fondo }]}>
      <View style={estilos.opcionIcono}>
        <Ionicons name={icono} size={22} color={colores.primarioOscuro} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={estilos.opcionTitulo}>{titulo}</Text>
        <Text style={estilos.opcionDetalle}>{detalle}</Text>
      </View>
      {contador ? (
        <View style={estilos.contador}>
          <Text style={estilos.contadorTexto}>{contador}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colores.textoTenue} />
    </Pressable>
  );
}

export const estilosAdmin = StyleSheet.create({
  tarjeta: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: espacio.lg, marginBottom: espacio.md, ...sombra },
  seccion: { fontSize: 17, fontWeight: '800', color: colores.texto, marginTop: espacio.lg, marginBottom: espacio.md },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
  nombre: { fontSize: 15, fontWeight: '800', color: colores.texto },
  detalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.md },
});

const estilos = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'flex-end', gap: espacio.md, marginBottom: espacio.lg },
  sello: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#E0ECF4',
    borderRadius: radio.total,
    paddingHorizontal: espacio.sm,
    paddingVertical: 3,
    marginBottom: espacio.sm,
  },
  selloTexto: { fontSize: 11, fontWeight: '800', color: colores.primarioOscuro, textTransform: 'uppercase', letterSpacing: 0.5 },
  titulo: { fontSize: 26, fontWeight: '800', color: colores.texto },
  subtitulo: { fontSize: 14, color: colores.textoSuave, marginTop: 2 },
  insignia: { borderRadius: radio.total, paddingHorizontal: espacio.sm, paddingVertical: 3, alignSelf: 'flex-start' },
  insigniaTexto: { fontSize: 12, fontWeight: '700' },
  indicador: { flexBasis: '46%', flexGrow: 1, backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: espacio.lg, gap: 2, ...sombra },
  indicadorIcono: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: espacio.sm },
  indicadorValor: { fontSize: 28, fontWeight: '800', color: colores.texto },
  indicadorEtiqueta: { fontSize: 13, fontWeight: '600', color: colores.textoSuave },
  indicadorDetalle: { fontSize: 12, color: colores.textoTenue },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, padding: espacio.md, borderRadius: radio.md },
  opcionIcono: { width: 44, height: 44, borderRadius: radio.md, backgroundColor: '#E0ECF4', alignItems: 'center', justifyContent: 'center' },
  opcionTitulo: { fontSize: 15, fontWeight: '800', color: colores.texto },
  opcionDetalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
  contador: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: colores.gasto, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  contadorTexto: { color: colores.blanco, fontSize: 12, fontWeight: '800' },
});
