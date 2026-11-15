import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { CampoValor, estilosFormulario as estilos, validarValor } from '@/components/CampoValor';
import { Pantalla } from '@/components/Pantalla';
import { SelectorFecha } from '@/components/SelectorFecha';
import { useCelebraciones } from '@/context/celebraciones';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import { celebracionesDeAporte } from '@/lib/celebraciones';
import { hoyISO, leerValor } from '@/lib/formato';
import type { ResultadoAporte } from '@/lib/tipos';

// HU-17: registrar el dinero que ahorro para una meta (CA-33, CA-34).
export default function FormularioAporte() {
  const { idMeta, nombre } = useLocalSearchParams<{ idMeta: string; nombre?: string }>();
  const { celebrar } = useCelebraciones();
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState<string | null>(hoyISO());
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const errorValor = validarValor(valor);
    setErrores(errorValor ? { valor: errorValor } : {});
    setErrorGeneral('');
    if (errorValor) return;
    setGuardando(true);
    try {
      const resultado = await api.post<ResultadoAporte>(`/metas/${idMeta}/aportes`, {
        valor: leerValor(valor),
        fecha,
        descripcion: descripcion.trim(),
      });
      router.back();
      celebrar(celebracionesDeAporte(resultado));
    } catch (e) {
      if (e instanceof ErrorApi) setErrores(e.campos);
      setErrorGeneral(mensajeError(e));
      setGuardando(false);
    }
  };

  return (
    <Pantalla bordes={['bottom']} pie={<Boton titulo="Guardar ahorro" icono="checkmark" onPress={guardar} cargando={guardando} />}>
      <Text style={estilos.intro}>
        {nombre ? `Registra el dinero que separaste para "${nombre}".` : 'Registra el dinero que separaste para esta meta.'}
      </Text>
      {errorGeneral ? <Aviso mensaje={errorGeneral} /> : null}
      <View style={estilos.tarjeta}>
        <CampoValor etiqueta="¿Cuánto ahorraste?" valor={valor} alCambiar={setValor} error={errores.valor} autoFocus />
        <SelectorFecha etiqueta="Fecha" valor={fecha} alCambiar={setFecha} error={errores.fecha} />
        <Campo
          etiqueta="Nota (opcional)"
          icono="create-outline"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Ej: Ahorro de la quincena"
          maxLength={150}
          error={errores.descripcion}
        />
      </View>
    </Pantalla>
  );
}
