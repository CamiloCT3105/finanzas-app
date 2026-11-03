import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { CampoValor, estilosFormulario as estilos, validarValor } from '@/components/CampoValor';
import { Dialogo } from '@/components/Dialogo';
import { Chips } from '@/components/Opciones';
import { Pantalla } from '@/components/Pantalla';
import { SelectorFecha } from '@/components/SelectorFecha';
import { iconoIngreso } from '@/lib/categorias';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import { hoyISO, leerValor, valorATexto } from '@/lib/formato';
import { TIPOS_INGRESO, type TipoIngreso } from '@/lib/tipos';
import { espacio } from '@/theme';

type Parametros = { id?: string; valor?: string; tipo?: TipoIngreso; fecha?: string; descripcion?: string };

// HU-04: registrar ingreso indicando su tipo. HU-08: editar o eliminar un ingreso.
export default function FormularioIngreso() {
  const params = useLocalSearchParams<Parametros>();
  const editando = !!params.id;

  const [valor, setValor] = useState(params.valor ? valorATexto(Number(params.valor)) : '');
  const [tipo, setTipo] = useState<TipoIngreso | null>(params.tipo ?? null);
  const [fecha, setFecha] = useState<string | null>(params.fecha ?? hoyISO());
  const [descripcion, setDescripcion] = useState(params.descripcion ?? '');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const guardar = async () => {
    // CA-08: la app valida antes de enviar; el backend vuelve a validar.
    const encontrados: Record<string, string> = {};
    const errorValor = validarValor(valor);
    if (errorValor) encontrados.valor = errorValor;
    if (!tipo) encontrados.tipo = 'Selecciona el tipo de ingreso.';
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    try {
      const cuerpo = { valor: leerValor(valor), tipo, fecha, descripcion: descripcion.trim() };
      if (editando) await api.put(`/ingresos/${params.id}`, cuerpo);
      else await api.post('/ingresos', cuerpo);
      router.back();
    } catch (e) {
      if (e instanceof ErrorApi) setErrores(e.campos);
      setErrorGeneral(mensajeError(e));
      setGuardando(false);
    }
  };

  // CA-16: solo se elimina después de confirmar.
  const eliminar = async () => {
    setEliminando(true);
    try {
      await api.delete(`/ingresos/${params.id}`);
      setConfirmarEliminar(false);
      router.back();
    } catch (e) {
      setConfirmarEliminar(false);
      setErrorGeneral(mensajeError(e));
      setEliminando(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: editando ? 'Editar ingreso' : 'Registrar ingreso' }} />
      <Pantalla
        bordes={['bottom']}
        pie={
          <View style={estilos.pie}>
            {editando ? (
              <Boton titulo="Eliminar" variante="peligro" icono="trash-outline" onPress={() => setConfirmarEliminar(true)} estilo={estilos.botonSecundario} />
            ) : null}
            <Boton titulo={editando ? 'Guardar cambios' : 'Guardar ingreso'} icono="checkmark" onPress={guardar} cargando={guardando} estilo={{ flex: 1 }} />
          </View>
        }
      >
        <Text style={estilos.intro}>
          {editando
            ? 'Corrige los datos del ingreso. Tu dinero disponible se recalculará al guardar.'
            : 'Registra el dinero que recibes en el mes para calcular cuánto tienes disponible.'}
        </Text>
        {errorGeneral ? <Aviso mensaje={errorGeneral} /> : null}

        <View style={estilos.tarjeta}>
          <CampoValor etiqueta="¿Cuánto recibiste?" valor={valor} alCambiar={setValor} error={errores.valor} autoFocus={!editando} />

          <Text style={estilos.etiqueta}>Tipo de ingreso</Text>
          <Chips
            opciones={TIPOS_INGRESO.map((t) => ({ ...t, icono: iconoIngreso(t.valor) }))}
            valor={tipo}
            alCambiar={setTipo}
          />
          {errores.tipo ? <Text style={estilos.error}>{errores.tipo}</Text> : null}
          <View style={{ height: espacio.lg }} />

          <SelectorFecha etiqueta="Fecha" valor={fecha} alCambiar={setFecha} error={errores.fecha} />
          <Campo
            etiqueta="Descripción (opcional)"
            icono="create-outline"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Ej: Salario de octubre"
            maxLength={150}
            error={errores.descripcion}
          />
        </View>
      </Pantalla>

      <Dialogo
        visible={confirmarEliminar}
        titulo="¿Eliminar este ingreso?"
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
