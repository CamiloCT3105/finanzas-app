import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { BarraProgreso } from '@/components/BarraProgreso';
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
import type { MetaConProgreso, ResultadoAporte, RetosUsuario } from '@/lib/tipos';
import { colores, espacio, radio } from '@/theme';

// HU-21: registrar el avance de un reto; lo ahorrado se suma a una meta.
export default function AvanceReto() {
  const { celebrar } = useCelebraciones();
  const { datos, cargando } = useDatos(async () => {
    const [retos, metas] = await Promise.all([api.get<RetosUsuario>('/retos'), api.get<MetaConProgreso[]>('/metas')]);
    return { activo: retos.activo, metas: metas.filter((m) => m.estado === 'activa') };
  });

  const [valor, setValor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idMeta, setIdMeta] = useState<number | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const metaElegida = idMeta ?? (datos?.metas.length === 1 ? datos.metas[0]!.id : null);

  if (cargando && !datos) {
    return (
      <Pantalla bordes={['bottom']}>
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
      </Pantalla>
    );
  }
  if (!datos?.activo) {
    return (
      <Pantalla bordes={['bottom']}>
        <Aviso tipo="info" mensaje="No tienes un reto activo. Elige uno en la sección de retos." />
      </Pantalla>
    );
  }
  if (datos.metas.length === 0) {
    return (
      <Pantalla bordes={['bottom']}>
        <EstadoVacio
          icono="flag-outline"
          titulo="Primero crea una meta"
          mensaje="Lo que ahorras en el reto se suma a una meta. Crea una para registrar tu avance."
          accion={{ titulo: 'Crear una meta', onPress: () => router.replace('/meta/nueva') }}
        />
      </Pantalla>
    );
  }

  const reto = datos.activo;
  const porcentaje = Math.min(100, Math.floor((reto.ahorrado / reto.objetivo) * 100));

  const guardar = async () => {
    const encontrados: Record<string, string> = {};
    const errorValor = validarValor(valor);
    if (errorValor) encontrados.valor = errorValor;
    if (!metaElegida) encontrados.id_meta = 'Elige la meta a la que se suma lo ahorrado.';
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length) return;
    setGuardando(true);
    try {
      const resultado = await api.post<ResultadoAporte & { reto: RetosUsuario['activo'] }>('/retos/activo/avance', {
        valor: leerValor(valor),
        id_meta: metaElegida,
        descripcion: descripcion.trim(),
      });
      router.back();
      const nuevo = resultado.reto;
      const listo = nuevo && nuevo.ahorrado >= nuevo.objetivo;
      celebrar([
        ...(listo
          ? [
              {
                titulo: '¡Objetivo del reto alcanzado!',
                mensaje: 'Ya puedes marcar el reto como completado en la sección de retos.',
                icono: 'flag' as const,
                etiqueta: 'Reto',
              },
            ]
          : []),
        ...celebracionesDeAporte(resultado),
      ]);
    } catch (e) {
      if (e instanceof ErrorApi) setErrores(e.campos);
      setErrorGeneral(mensajeError(e));
      setGuardando(false);
    }
  };

  return (
    <Pantalla bordes={['bottom']} pie={<Boton titulo="Registrar avance" icono="checkmark" onPress={guardar} cargando={guardando} />}>
      <View style={estilos.reto}>
        <Text style={estilos.retoNombre}>{reto.nombre}</Text>
        <BarraProgreso porcentaje={porcentaje} color={colores.advertencia} alto={8} />
        <Text style={estilos.retoDetalle}>
          {moneda(reto.ahorrado)} de {moneda(reto.objetivo)} · {reto.dias_restantes} {reto.dias_restantes === 1 ? 'día restante' : 'días restantes'}
        </Text>
      </View>
      {errorGeneral ? <Aviso mensaje={errorGeneral} /> : null}
      <View style={estilosFormulario.tarjeta}>
        <CampoValor etiqueta="¿Cuánto ahorraste hoy para el reto?" valor={valor} alCambiar={setValor} error={errores.valor} autoFocus />
        <Campo
          etiqueta="Nota (opcional)"
          icono="create-outline"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Ej: No compré café"
          maxLength={150}
          error={errores.descripcion}
        />
        <SelectorMeta metas={datos.metas} valor={metaElegida} alCambiar={setIdMeta} error={errores.id_meta} />
      </View>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  reto: { backgroundColor: '#FFF7ED', borderRadius: radio.lg, padding: espacio.lg, marginBottom: espacio.lg, gap: espacio.sm },
  retoNombre: { fontSize: 16, fontWeight: '800', color: colores.texto },
  retoDetalle: { fontSize: 13, color: colores.textoSuave },
});
