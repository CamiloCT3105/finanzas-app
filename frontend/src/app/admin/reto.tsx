import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { CampoValor, estilosFormulario } from '@/components/CampoValor';
import { Pantalla } from '@/components/Pantalla';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import { leerValor, valorATexto } from '@/lib/formato';
import type { RetoAdmin } from '@/lib/tipos';

// HU-30: crear o editar un reto (CA-59, CA-60).
export default function FormularioReto() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [duracion, setDuracion] = useState('');
  const [condiciones, setCondiciones] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<RetoAdmin[]>('/admin/retos')
      .then((lista) => {
        const r = lista.find((x) => String(x.id) === id);
        if (!r) return;
        setNombre(r.nombre);
        setDescripcion(r.descripcion);
        setObjetivo(valorATexto(r.objetivo));
        setDuracion(String(r.duracion_dias));
        setCondiciones(r.condiciones ?? '');
      })
      .catch((e) => setErrorGeneral(mensajeError(e)));
  }, [id]);

  const guardar = async () => {
    // CA-60: se indican todos los campos que faltan
    const encontrados: Record<string, string> = {};
    if (!nombre.trim()) encontrados.nombre = 'El nombre del reto es obligatorio.';
    if (!descripcion.trim()) encontrados.descripcion = 'La descripción es obligatoria.';
    const valor = leerValor(objetivo);
    if (!objetivo.trim()) encontrados.objetivo = 'El objetivo es obligatorio.';
    else if (valor === null || valor <= 0) encontrados.objetivo = 'El objetivo debe ser un valor mayor que cero.';
    const dias = Number(duracion);
    if (!duracion.trim()) encontrados.duracion_dias = 'La duración es obligatoria.';
    else if (!Number.isInteger(dias) || dias < 1 || dias > 365) encontrados.duracion_dias = 'La duración debe ser un número de días entre 1 y 365.';
    setErrores(encontrados);
    const faltan = [!objetivo.trim() && 'objetivo', !duracion.trim() && 'duración'].filter(Boolean);
    setErrorGeneral(faltan.length ? `Faltan campos obligatorios: ${faltan.join(' y ')}.` : '');
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    try {
      const cuerpo = { nombre: nombre.trim(), descripcion: descripcion.trim(), objetivo: valor, duracion_dias: dias, condiciones: condiciones.trim() };
      if (editando) await api.put(`/admin/retos/${id}`, cuerpo);
      else await api.post('/admin/retos', cuerpo);
      router.back();
    } catch (e) {
      if (e instanceof ErrorApi) setErrores(e.campos);
      setErrorGeneral(mensajeError(e));
      setGuardando(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: editando ? 'Editar reto' : 'Nuevo reto' }} />
      <Pantalla bordes={['bottom']} pie={<Boton titulo={editando ? 'Guardar cambios' : 'Crear reto'} icono="checkmark" onPress={guardar} cargando={guardando} />}>
        {errorGeneral ? <Aviso mensaje={errorGeneral} /> : null}
        <View style={estilosFormulario.tarjeta}>
          <Campo etiqueta="Nombre" icono="trophy-outline" value={nombre} onChangeText={setNombre} placeholder="Ej: Semana sin cafés" maxLength={100} error={errores.nombre} />
          <Campo
            etiqueta="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="¿En qué consiste el reto?"
            multiline
            maxLength={255}
            error={errores.descripcion}
          />
          <CampoValor etiqueta="Objetivo de ahorro" valor={objetivo} alCambiar={setObjetivo} error={errores.objetivo} />
          <Campo
            etiqueta="Duración (días)"
            icono="calendar-outline"
            value={duracion}
            onChangeText={setDuracion}
            placeholder="Ej: 7"
            keyboardType="number-pad"
            inputMode="numeric"
            error={errores.duracion_dias}
          />
          <Campo
            etiqueta="Condiciones de cumplimiento"
            value={condiciones}
            onChangeText={setCondiciones}
            placeholder="Ej: Registrar al menos el objetivo en avances antes del plazo"
            multiline
            maxLength={255}
            error={errores.condiciones}
          />
        </View>
      </Pantalla>
    </>
  );
}
