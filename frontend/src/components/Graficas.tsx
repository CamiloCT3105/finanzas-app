import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colores, espacio, radio } from '@/theme';

export interface Segmento {
  valor: number;
  color: string;
  etiqueta: string;
}

/** Gráfica de dona: cada segmento ocupa una parte del círculo proporcional a su valor. */
export function Dona({
  datos,
  tamano = 180,
  grosor = 26,
  centro,
}: {
  datos: Segmento[];
  tamano?: number;
  grosor?: number;
  centro?: ReactNode;
}) {
  const r = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * r;
  const total = datos.reduce((acc, d) => acc + d.valor, 0);
  const separacion = datos.filter((d) => d.valor > 0).length > 1 ? 2 : 0;
  let acumulado = 0;

  return (
    <View
      style={{ width: tamano, height: tamano }}
      accessibilityRole="image"
      accessibilityLabel={`Gráfica de dona: ${datos.map((d) => `${d.etiqueta} ${Math.round((d.valor / (total || 1)) * 100)} %`).join(', ')}`}
    >
      {/* Se rota la vista completa para que la dona empiece arriba (rotation/origin en SVG genera avisos en web). */}
      <Svg width={tamano} height={tamano} style={{ transform: [{ rotate: '-90deg' }] }}>
        <G>
          <Circle cx={tamano / 2} cy={tamano / 2} r={r} stroke="#EEF1F5" strokeWidth={grosor} fill="none" />
          {total > 0
            ? datos.map((d) => {
                const largo = (d.valor / total) * circunferencia;
                const offset = acumulado;
                acumulado += largo;
                return (
                  <Circle
                    key={d.etiqueta}
                    cx={tamano / 2}
                    cy={tamano / 2}
                    r={r}
                    stroke={d.color}
                    strokeWidth={grosor}
                    fill="none"
                    strokeDasharray={`${Math.max(largo - separacion, 0.1)} ${circunferencia}`}
                    strokeDashoffset={-offset}
                  />
                );
              })
            : null}
        </G>
      </Svg>
      {centro ? <View style={[StyleSheet.absoluteFill, estilos.centro]}>{centro}</View> : null}
    </View>
  );
}

export interface Barra {
  etiqueta: string;
  valor: number;
  color?: string;
  texto?: string;
}

/** Barras verticales hechas con vistas, para que se adapten al ancho disponible. */
export function BarrasVerticales({
  datos,
  alto = 160,
  mostrarValores = true,
  colorBase = colores.primario,
}: {
  datos: Barra[];
  alto?: number;
  mostrarValores?: boolean;
  colorBase?: string;
}) {
  const maximo = Math.max(1, ...datos.map((d) => d.valor));
  const muchas = datos.length > 10;
  return (
    <View accessibilityRole="image" accessibilityLabel={datos.map((d) => `${d.etiqueta}: ${d.texto ?? d.valor}`).join(', ')}>
      <View style={[estilos.barras, { height: alto, gap: muchas ? 2 : espacio.md }]}>
        {datos.map((d, i) => {
          const altura = d.valor > 0 ? Math.max(4, (d.valor / maximo) * (alto - (mostrarValores ? 22 : 0))) : 2;
          return (
            <View key={`${d.etiqueta}-${i}`} style={estilos.columna}>
              {mostrarValores && !muchas ? (
                <Text style={estilos.valor} numberOfLines={1}>
                  {d.texto ?? d.valor}
                </Text>
              ) : null}
              <View
                style={[
                  estilos.barra,
                  { height: altura, backgroundColor: d.valor > 0 ? (d.color ?? colorBase) : colores.borde },
                  muchas && { borderTopLeftRadius: 3, borderTopRightRadius: 3 },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={[estilos.etiquetas, { gap: muchas ? 2 : espacio.md }]}>
        {datos.map((d, i) => (
          <Text key={`${d.etiqueta}-${i}`} style={[estilos.etiqueta, muchas && { fontSize: 9 }]} numberOfLines={1}>
            {d.etiqueta}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Leyenda con punto de color, nombre, porcentaje y valor. */
export function Leyenda({ items }: { items: { color: string; etiqueta: string; detalle: string; valor: string }[] }) {
  return (
    <View style={{ gap: espacio.sm }}>
      {items.map((i) => (
        <View key={i.etiqueta} style={estilos.leyenda}>
          <View style={[estilos.punto, { backgroundColor: i.color }]} />
          <Text style={estilos.leyendaNombre} numberOfLines={1}>
            {i.etiqueta}
          </Text>
          <Text style={estilos.leyendaDetalle}>{i.detalle}</Text>
          <Text style={estilos.leyendaValor}>{i.valor}</Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  barras: { flexDirection: 'row', alignItems: 'flex-end' },
  columna: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barra: { width: '100%', maxWidth: 56, borderTopLeftRadius: radio.sm, borderTopRightRadius: radio.sm },
  valor: { fontSize: 12, fontWeight: '700', color: colores.texto, marginBottom: 4 },
  etiquetas: { flexDirection: 'row', marginTop: 6 },
  etiqueta: { flex: 1, textAlign: 'center', fontSize: 12, color: colores.textoSuave },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  punto: { width: 10, height: 10, borderRadius: 5 },
  leyendaNombre: { flex: 1, fontSize: 14, color: colores.texto, fontWeight: '600' },
  leyendaDetalle: { fontSize: 13, color: colores.textoSuave, minWidth: 52, textAlign: 'right' },
  leyendaValor: { fontSize: 14, color: colores.texto, fontWeight: '700', minWidth: 96, textAlign: 'right' },
});
