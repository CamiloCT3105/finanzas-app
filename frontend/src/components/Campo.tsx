import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colores, espacio, radio } from '@/theme';

interface Props extends TextInputProps {
  etiqueta: string;
  error?: string | undefined;
  ayuda?: string | undefined;
  icono?: ComponentProps<typeof Ionicons>['name'];
  prefijo?: string;
  contrasena?: boolean;
}

export function Campo({ etiqueta, error, ayuda, icono, prefijo, contrasena, style, ...props }: Props) {
  const [enfocado, setEnfocado] = useState(false);
  const [oculto, setOculto] = useState(true);
  const colorBorde = error ? colores.gasto : enfocado ? colores.primario : colores.borde;

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <View style={[estilos.caja, { borderColor: colorBorde }, enfocado && estilos.cajaEnfocada]}>
        {icono ? <Ionicons name={icono} size={20} color={enfocado ? colores.primario : colores.textoTenue} /> : null}
        {prefijo ? <Text style={estilos.prefijo}>{prefijo}</Text> : null}
        <TextInput
          placeholderTextColor={colores.textoTenue}
          {...props}
          secureTextEntry={contrasena ? oculto : props.secureTextEntry}
          onFocus={(e) => {
            setEnfocado(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            props.onBlur?.(e);
          }}
          style={[estilos.input, prefijo ? estilos.inputGrande : null, style]}
          accessibilityLabel={etiqueta}
        />
        {contrasena ? (
          <Pressable
            onPress={() => setOculto((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={oculto ? 'Mostrar contraseña' : 'Ocultar contraseña'}
          >
            <Ionicons name={oculto ? 'eye-outline' : 'eye-off-outline'} size={20} color={colores.textoSuave} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={estilos.filaError}>
          <Ionicons name="alert-circle" size={14} color={colores.gasto} />
          <Text style={estilos.error}>{error}</Text>
        </View>
      ) : ayuda ? (
        <Text style={estilos.ayuda}>{ayuda}</Text>
      ) : null}
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
    backgroundColor: colores.tarjeta,
  },
  cajaEnfocada: { backgroundColor: '#FBFEFD' },
  prefijo: { fontSize: 22, fontWeight: '700', color: colores.textoSuave },
  input: { flex: 1, fontSize: 16, color: colores.texto, paddingVertical: espacio.md, outlineStyle: 'none' } as object,
  inputGrande: { fontSize: 22, fontWeight: '700' },
  filaError: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  error: { color: colores.gasto, fontSize: 13, flexShrink: 1 },
  ayuda: { color: colores.textoSuave, fontSize: 13, marginTop: 6 },
});
