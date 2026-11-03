import { StyleSheet } from 'react-native';
import { leerValor, moneda } from '@/lib/formato';
import { colores, espacio, radio, sombra } from '@/theme';
import { Campo } from './Campo';

/** Estilos compartidos por los formularios de ingreso, gasto y meta. */
export const estilosFormulario = StyleSheet.create({
  intro: { fontSize: 15, color: colores.textoSuave, lineHeight: 21, marginBottom: espacio.lg },
  tarjeta: { backgroundColor: colores.tarjeta, borderRadius: radio.xl, padding: espacio.xl, ...sombra },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginBottom: espacio.sm },
  error: { color: colores.gasto, fontSize: 13, marginTop: 6 },
  pie: { flexDirection: 'row', gap: espacio.md },
  botonSecundario: { paddingHorizontal: espacio.lg },
});

/** Campo de dinero: muestra cómo quedará el valor formateado mientras se escribe. */
export function CampoValor({
  etiqueta,
  valor,
  alCambiar,
  error,
  autoFocus,
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (texto: string) => void;
  error?: string | undefined;
  autoFocus?: boolean;
}) {
  const numero = leerValor(valor);
  return (
    <Campo
      etiqueta={etiqueta}
      prefijo="$"
      value={valor}
      onChangeText={alCambiar}
      placeholder="0"
      keyboardType="decimal-pad"
      inputMode="decimal"
      autoFocus={autoFocus}
      error={error}
      ayuda={numero && numero > 0 ? `Valor: ${moneda(numero)}` : 'Escribe el valor sin puntos o con puntos de miles.'}
    />
  );
}

/** Mensaje de validación compartido para valores monetarios (CA-08, CA-10). */
export function validarValor(texto: string): string | undefined {
  const numero = leerValor(texto);
  if (!texto.trim()) return 'Ingresa un valor mayor que cero.';
  if (numero === null) return 'El valor solo puede tener números. Ingresa un valor mayor que cero.';
  if (numero <= 0) return 'Ingresa un valor mayor que cero.';
  return undefined;
}
