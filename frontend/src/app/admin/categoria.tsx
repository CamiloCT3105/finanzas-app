import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { estilosFormulario } from '@/components/CampoValor';
import { Pantalla } from '@/components/Pantalla';
import { api, ErrorApi, mensajeError } from '@/lib/api';
import type { CategoriaAdmin } from '@/lib/tipos';

// HU-29: crear o editar una categoría; el nombre no se puede repetir (CA-57).
export default function FormularioCategoria() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<CategoriaAdmin[]>('/admin/categorias')
      .then((lista) => {
        const c = lista.find((x) => String(x.id) === id);
        if (!c) return;
        setNombre(c.nombre);
        setDescripcion(c.descripcion ?? '');
      })
      .catch((e) => setErrorGeneral(mensajeError(e)));
  }, [id]);

  const guardar = async () => {
    const encontrados: Record<string, string> = {};
    if (nombre.trim().length < 3) encontrados.nombre = 'El nombre debe tener al menos 3 caracteres.';
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length) return;
    setGuardando(true);
    try {
      const cuerpo = { nombre: nombre.trim(), descripcion: descripcion.trim() };
      if (editando) await api.put(`/admin/categorias/${id}`, cuerpo);
      else await api.post('/admin/categorias', cuerpo);
      router.back();
    } catch (e) {
      if (e instanceof ErrorApi) setErrores(e.campos);
      setErrorGeneral(mensajeError(e));
      setGuardando(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: editando ? 'Editar categoría' : 'Nueva categoría' }} />
      <Pantalla bordes={['bottom']} pie={<Boton titulo={editando ? 'Guardar cambios' : 'Crear categoría'} icono="checkmark" onPress={guardar} cargando={guardando} />}>
        {errorGeneral ? <Aviso mensaje={errorGeneral} /> : null}
        <View style={estilosFormulario.tarjeta}>
          <Campo etiqueta="Nombre" icono="pricetag-outline" value={nombre} onChangeText={setNombre} placeholder="Ej: Mascotas" maxLength={60} error={errores.nombre} />
          <Campo
            etiqueta="Descripción (opcional)"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="¿Qué gastos incluye?"
            maxLength={255}
            error={errores.descripcion}
          />
        </View>
      </Pantalla>
    </>
  );
}
