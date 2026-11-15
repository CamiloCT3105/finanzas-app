import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { CampoValor, estilosFormulario as estilos } from '@/components/CampoValor';
import { Pantalla } from '@/components/Pantalla';
import { SelectorFecha } from '@/components/SelectorFecha';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import { hoyISO, leerValor } from '@/lib/formato';

// HU-15: crear una meta de ahorro con nombre y valor objetivo.
export default function FormularioMeta() {
  const [nombre, setNombre] = useState('');
  const [valor, setValor] = useState('');
  const [fechaLimite, setFechaLimite] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    // CA-30: se indican todos los campos que faltan.
    const encontrados: Record<string, string> = {};
    if (!nombre.trim()) encontrados.nombre = 'El nombre de la meta es obligatorio.';
    const numero = leerValor(valor);
    if (!valor.trim()) encontrados.valor_objetivo = 'El valor objetivo es obligatorio.';
    else if (numero === null || numero <= 0) encontrados.valor_objetivo = 'El valor objetivo debe ser un número mayor que cero.';
    setErrores(encontrados);
    setErrorGeneral(
      encontrados.nombre && encontrados.valor_objetivo && !valor.trim()
        ? 'Faltan campos obligatorios: nombre y valor objetivo.'
        : '',
    );
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    try {
      await api.post('/metas', {
        nombre: nombre.trim(),
        valor_objetivo: numero,
        fecha_limite: fechaLimite,
        descripcion: descripcion.trim(),
      });
      router.back();
    } catch (e) {
      if (e instanceof ErrorApi) setErrores(e.campos);
      setErrorGeneral(mensajeError(e));
      setGuardando(false);
    }
  };

  return (
    <Pantalla bordes={['bottom']} pie={<Boton titulo="Crear meta" icono="flag" onPress={guardar} cargando={guardando} />}>
      <Text style={estilos.intro}>Ponle nombre a lo que quieres lograr y define cuánto necesitas ahorrar.</Text>
      {errorGeneral ? <Aviso mensaje={errorGeneral} /> : null}

      <View style={estilos.tarjeta}>
        <Campo
          etiqueta="Nombre de la meta"
          icono="flag-outline"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Comprar una moto"
          maxLength={100}
          error={errores.nombre}
          autoFocus
        />
        <CampoValor etiqueta="Valor objetivo" valor={valor} alCambiar={setValor} error={errores.valor_objetivo} />
        <SelectorFecha
          etiqueta="Fecha límite (opcional)"
          valor={fechaLimite}
          alCambiar={setFechaLimite}
          error={errores.fecha_limite}
          opcional
          minima={hoyISO()}
        />
        <Campo
          etiqueta="Descripción (opcional)"
          icono="create-outline"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="¿Por qué es importante para ti?"
          maxLength={255}
          multiline
          error={errores.descripcion}
        />
      </View>
    </Pantalla>
  );
}
