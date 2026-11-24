import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { CampoValor, estilosFormulario, validarValor } from '@/components/CampoValor';
import { EstadoVacio } from '@/components/EstadoVacio';
import { Pantalla } from '@/components/Pantalla';
import { SelectorMeta } from '@/components/SelectorMeta';
import { useCelebraciones } from '@/context/celebraciones';
import { useDatos } from '@/hooks/useDatos';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import { celebracionesDeAporte } from '@/lib/celebraciones';
import { leerValor, moneda } from '@/lib/formato';
import type { MetaConProgreso, ResultadoAporte } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

const SUGERENCIAS = ['Domicilio', 'Café', 'Taxi', 'Compra por impulso', 'Comida rápida', 'Salida'];

// HU-20: registrar un gasto que decidí no hacer y sumarlo a una meta (CA-39, CA-40).
export default function GastoEvitado() {
  const { celebrar } = useCelebraciones();
  const { datos: metas, cargando } = useDatos(() => api.get<MetaConProgreso[]>('/metas'));
  const activas = metas?.filter((m) => m.estado === 'activa') ?? [];

  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [idMeta, setIdMeta] = useState<number | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [sinMetas, setSinMetas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const metaElegida = idMeta ?? (activas.length === 1 ? activas[0]!.id : null);

  const guardar = async () => {
    const encontrados: Record<string, string> = {};
    if (!descripcion.trim()) encontrados.descripcion = 'Cuéntanos qué gasto evitaste.';
    const errorValor = validarValor(valor);
    if (errorValor) encontrados.valor = errorValor;
    if (!metaElegida) encontrados.id_meta = 'Elige la meta a la que se suma el ahorro.';
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length) return;
    setGuardando(true);
    try {
      const resultado = await api.post<ResultadoAporte>('/metas/gasto-evitado', {
        descripcion: descripcion.trim(),
        valor: leerValor(valor),
        id_meta: metaElegida,
      });
      router.back();
      celebrar([
        {
          titulo: `¡Ahorraste ${moneda(resultado.aporte.valor)}!`,
          mensaje: `Decidir no gastar en "${resultado.aporte.descripcion}" sumó ese dinero a "${resultado.meta.nombre}".`,
          icono: 'shield-checkmark',
          etiqueta: 'Gasto evitado',
        },
        ...celebracionesDeAporte(resultado),
      ]);
    } catch (e) {
      if (e instanceof ErrorApi && e.campos.codigo === 'SIN_METAS') {
        setSinMetas(true);
      } else {
        if (e instanceof ErrorApi) setErrores(e.campos);
        setErrorGeneral(mensajeError(e));
      }
      setGuardando(false);
    }
  };

  if (cargando && !metas) {
    return (
      <Pantalla bordes={['bottom']}>
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
      </Pantalla>
    );
  }

  // CA-40: sin metas activas se pide crear una primero
  if (sinMetas || (metas && activas.length === 0)) {
    return (
      <Pantalla bordes={['bottom']}>
        <EstadoVacio
          icono="flag-outline"
          titulo="Primero crea una meta"
          mensaje="Los gastos que evitas se convierten en ahorro para una meta. Crea una meta para empezar a sumarle."
          accion={{ titulo: 'Crear una meta', onPress: () => router.replace('/meta/nueva') }}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla bordes={['bottom']} pie={<Boton titulo="Sumar a mi meta" icono="checkmark" onPress={guardar} cargando={guardando} />}>
      <Text style={estilosFormulario.intro}>
        ¿Decidiste no hacer un gasto? Regístralo y ese dinero se suma a tu meta como ahorro.
      </Text>
      {errorGeneral ? <Aviso mensaje={errorGeneral} /> : null}
      <View style={estilosFormulario.tarjeta}>
        <Campo
          etiqueta="¿Qué gasto evitaste?"
          icono="shield-checkmark-outline"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Ej: Domicilio del viernes"
          maxLength={150}
          error={errores.descripcion}
        />
        <View style={estilos.sugerencias}>
          {SUGERENCIAS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setDescripcion(s)}
              style={[estilos.sugerencia, descripcion === s && estilos.sugerenciaActiva]}
              accessibilityRole="button"
            >
              <Text style={[estilos.sugerenciaTexto, descripcion === s && { color: colores.primario }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <CampoValor etiqueta="¿Cuánto habrías gastado?" valor={valor} alCambiar={setValor} error={errores.valor} />
        <SelectorMeta metas={activas} valor={metaElegida} alCambiar={setIdMeta} error={errores.id_meta} />
      </View>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  sugerencias: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.sm, marginTop: -espacio.sm, marginBottom: espacio.lg },
  sugerencia: {
    paddingHorizontal: espacio.md,
    paddingVertical: 6,
    borderRadius: radio.total,
    backgroundColor: colores.fondo,
    borderWidth: 1,
    borderColor: colores.fondo,
  },
  sugerenciaActiva: { borderColor: colores.primario, backgroundColor: colores.primarioSuave },
  sugerenciaTexto: { fontSize: 13, fontWeight: '600', color: colores.textoSuave },
});
