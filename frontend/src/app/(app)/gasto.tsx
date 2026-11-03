import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { CampoValor, estilosFormulario, validarValor } from '@/components/CampoValor';
import { Dialogo } from '@/components/Dialogo';
import { Segmentado } from '@/components/Opciones';
import { Pantalla } from '@/components/Pantalla';
import { SelectorFecha } from '@/components/SelectorFecha';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import { estiloCategoria } from '@/lib/categorias';
import { hoyISO, leerValor, valorATexto } from '@/lib/formato';
import type { Categoria, TipoGasto } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

type Parametros = {
  id?: string;
  valor?: string;
  tipo?: TipoGasto;
  fecha?: string;
  descripcion?: string;
  id_categoria?: string;
};

// Atajos para los gastos fijos más comunes (HU-05: arriendo, servicios y transporte).
const SUGERENCIAS_FIJOS = [
  { texto: 'Arriendo', categoria: 'Vivienda' },
  { texto: 'Servicios públicos', categoria: 'Servicios' },
  { texto: 'Internet y celular', categoria: 'Servicios' },
  { texto: 'Transporte', categoria: 'Transporte' },
];

// HU-05 / HU-06: registrar gastos fijos o variables. HU-07: con su categoría. HU-08: editar o eliminar.
export default function FormularioGasto() {
  const params = useLocalSearchParams<Parametros>();
  const editando = !!params.id;

  const [tipo, setTipo] = useState<TipoGasto>(params.tipo === 'fijo' ? 'fijo' : 'variable');
  const [valor, setValor] = useState(params.valor ? valorATexto(Number(params.valor)) : '');
  const [idCategoria, setIdCategoria] = useState<number | null>(params.id_categoria ? Number(params.id_categoria) : null);
  const [fecha, setFecha] = useState<string | null>(params.fecha ?? hoyISO());
  const [descripcion, setDescripcion] = useState(params.descripcion ?? '');
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // CA-13: la lista de categorías activas viene del backend.
  useEffect(() => {
    api
      .get<Categoria[]>('/categorias')
      .then(setCategorias)
      .catch((e) => setErrorGeneral(mensajeError(e)));
  }, []);

  const elegirCategoria = (id: number) => {
    setIdCategoria(id);
    setErrores(({ id_categoria: _, ...resto }) => resto);
  };

  const idOtros = categorias?.find((c) => c.nombre === 'Otros')?.id;

  const guardar = async () => {
    const encontrados: Record<string, string> = {};
    const errorValor = validarValor(valor);
    if (errorValor) encontrados.valor = errorValor;
    // CA-14: no se guarda sin categoría.
    if (!idCategoria) encontrados.id_categoria = 'Elige una categoría o usa "Otros".';
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    try {
      const cuerpo = { valor: leerValor(valor), tipo, id_categoria: idCategoria, fecha, descripcion: descripcion.trim() };
      if (editando) await api.put(`/gastos/${params.id}`, cuerpo);
      else await api.post('/gastos', cuerpo);
      router.back();
    } catch (e) {
      if (e instanceof ErrorApi) setErrores(e.campos);
      setErrorGeneral(mensajeError(e));
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    setEliminando(true);
    try {
      await api.delete(`/gastos/${params.id}`);
      setConfirmarEliminar(false);
      router.back();
    } catch (e) {
      setConfirmarEliminar(false);
      setErrorGeneral(mensajeError(e));
      setEliminando(false);
    }
  };

  const titulo = editando ? 'Editar gasto' : tipo === 'fijo' ? 'Gasto fijo' : 'Gasto variable';

  return (
    <>
      <Stack.Screen options={{ title: titulo }} />
      <Pantalla
        bordes={['bottom']}
        pie={
          <View style={estilosFormulario.pie}>
            {editando ? (
              <Boton
                titulo="Eliminar"
                variante="peligro"
                icono="trash-outline"
                onPress={() => setConfirmarEliminar(true)}
                estilo={estilosFormulario.botonSecundario}
              />
            ) : null}
            <Boton titulo={editando ? 'Guardar cambios' : 'Guardar gasto'} icono="checkmark" onPress={guardar} cargando={guardando} estilo={{ flex: 1 }} />
          </View>
        }
      >
        <Segmentado
          opciones={[
            { valor: 'fijo', etiqueta: 'Fijo', icono: 'repeat' },
            { valor: 'variable', etiqueta: 'Variable', icono: 'cart' },
          ]}
          valor={tipo}
          alCambiar={setTipo}
        />
        <Text style={[estilosFormulario.intro, { marginTop: espacio.md }]}>
          {tipo === 'fijo'
            ? 'Los gastos fijos se repiten cada mes, como el arriendo, los servicios o el transporte. Se descuentan de tu dinero disponible.'
            : 'Los gastos variables cambian día a día: mercado, salidas, domicilios. Así sabrás en qué se te va el dinero.'}
        </Text>
        {errorGeneral ? <Aviso mensaje={errorGeneral} /> : null}

        <View style={estilosFormulario.tarjeta}>
          <CampoValor etiqueta="¿Cuánto gastaste?" valor={valor} alCambiar={setValor} error={errores.valor} autoFocus={!editando} />

          {tipo === 'fijo' && !editando ? (
            <View style={estilos.sugerencias}>
              {SUGERENCIAS_FIJOS.map((s) => {
                const categoria = categorias?.find((c) => c.nombre === s.categoria);
                return (
                  <Pressable
                    key={s.texto}
                    onPress={() => {
                      setDescripcion(s.texto);
                      if (categoria) elegirCategoria(categoria.id);
                    }}
                    style={[estilos.sugerencia, descripcion === s.texto && estilos.sugerenciaActiva]}
                  >
                    <Text style={[estilos.sugerenciaTexto, descripcion === s.texto && { color: colores.primario }]}>{s.texto}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Text style={estilosFormulario.etiqueta}>Categoría</Text>
          {!categorias ? (
            <ActivityIndicator color={colores.primario} style={{ marginVertical: espacio.lg }} />
          ) : (
            <View style={estilos.grilla} accessibilityRole="radiogroup">
              {categorias.map((c) => {
                const e = estiloCategoria(c.nombre);
                const activa = c.id === idCategoria;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => elegirCategoria(c.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: activa }}
                    accessibilityLabel={c.nombre}
                    style={[estilos.categoria, activa && { borderColor: e.color, backgroundColor: e.fondo }]}
                  >
                    <View style={[estilos.categoriaIcono, { backgroundColor: activa ? colores.tarjeta : e.fondo }]}>
                      <Ionicons name={e.icono} size={16} color={e.color} />
                    </View>
                    <Text style={[estilos.categoriaTexto, activa && { color: e.color, fontWeight: '700' }]}>{c.nombre}</Text>
                    {activa ? <Ionicons name="checkmark-circle" size={16} color={e.color} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
          {errores.id_categoria ? (
            <View style={estilos.errorCategoria}>
              <Text style={[estilosFormulario.error, { marginTop: 0, flex: 1 }]}>{errores.id_categoria}</Text>
              {idOtros ? (
                <Pressable onPress={() => elegirCategoria(idOtros)} hitSlop={6}>
                  <Text style={estilos.usarOtros}>{'Usar "Otros"'}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <View style={{ height: espacio.lg }} />

          <SelectorFecha etiqueta="Fecha" valor={fecha} alCambiar={setFecha} error={errores.fecha} />
          <Campo
            etiqueta="Descripción (opcional)"
            icono="create-outline"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder={tipo === 'fijo' ? 'Ej: Arriendo apartamento' : 'Ej: Almuerzo con amigos'}
            maxLength={150}
            error={errores.descripcion}
          />
        </View>
      </Pantalla>

      <Dialogo
        visible={confirmarEliminar}
        titulo="¿Eliminar este gasto?"
        mensaje="Esta acción no se puede deshacer y tu dinero disponible se recalculará."
        textoConfirmar="Eliminar"
        peligro
        cargando={eliminando}
        alCancelar={() => setConfirmarEliminar(false)}
        alConfirmar={eliminar}
      />
    </>
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
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.sm },
  categoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: espacio.md,
    borderRadius: radio.total,
    borderWidth: 1.5,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  categoriaIcono: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  categoriaTexto: { fontSize: 14, color: colores.texto, fontWeight: '600' },
  errorCategoria: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm, marginTop: espacio.sm },
  usarOtros: { color: colores.primario, fontWeight: '700', fontSize: 13 },
});
