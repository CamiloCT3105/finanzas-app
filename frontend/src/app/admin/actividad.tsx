import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { estilosAdmin, Indicador } from '@/components/Admin';
import { Aviso } from '@/components/Aviso';
import { BarrasVerticales } from '@/components/Graficas';
import { Pantalla } from '@/components/Pantalla';
import { periodoInicial, SelectorPeriodo, type Periodo } from '@/components/SelectorPeriodo';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import { fechaCorta } from '@/lib/formato';
import type { Actividad } from '@/lib/tipos';
import { colores, espacio } from '@/theme';

// HU-31: actividad de la plataforma por períodos, agrupada por día y sin datos financieros (CA-61, CA-62).
export default function ActividadAdmin() {
  const [periodo, setPeriodo] = useState<Periodo>(periodoInicial);
  const { datos, error, cargando } = useDatos(
    () => api.get<Actividad>(`/admin/actividad?desde=${periodo.desde}&hasta=${periodo.hasta}`),
    `${periodo.desde}:${periodo.hasta}`,
  );
  const dias = datos?.dias ?? [];
  const etiqueta = (iso: string) => String(Number(iso.slice(8, 10)));

  return (
    <Pantalla bordes={['bottom']}>
      <SelectorPeriodo periodo={periodo} alCambiar={setPeriodo} />
      {error ? <Aviso mensaje={error} /> : null}
      {cargando && !datos ? (
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xl }} />
      ) : datos ? (
        <>
          <Text style={estilos.rango}>
            Del {fechaCorta(datos.desde)} al {fechaCorta(datos.hasta)}
          </Text>
          <View style={estilosAdmin.grilla}>
            <Indicador etiqueta="Usuarios activos" valor={datos.totales.usuarios_activos} icono="pulse" color={colores.primarioOscuro} fondo="#E0ECF4" />
            <Indicador etiqueta="Registros nuevos" valor={datos.totales.registros} icono="person-add" color="#15803D" fondo="#DCFCE7" />
            <Indicador etiqueta="Retos iniciados" valor={datos.totales.retos_iniciados} icono="rocket" color="#EA580C" fondo="#FFEDD5" />
            <Indicador etiqueta="Retos cumplidos" valor={datos.totales.retos_cumplidos} icono="medal" color="#B45309" fondo="#FEF3C7" />
          </View>

          <View style={[estilosAdmin.tarjeta, { marginTop: espacio.md }]}>
            <Text style={[estilosAdmin.nombre, { marginBottom: espacio.md }]}>Usuarios activos por día</Text>
            <BarrasVerticales
              alto={160}
              colorBase={colores.primarioOscuro}
              datos={dias.map((d) => ({ etiqueta: etiqueta(d.fecha), valor: d.usuarios_activos }))}
            />
          </View>

          <View style={[estilosAdmin.tarjeta, { padding: 0, overflow: 'hidden' }]}>
            <View style={[estilos.fila, estilos.encabezado]}>
              <Text style={[estilos.celda, estilos.celdaFecha, estilos.textoEncabezado]}>Día</Text>
              <Text style={[estilos.celda, estilos.textoEncabezado]}>Activos</Text>
              <Text style={[estilos.celda, estilos.textoEncabezado]}>Registros</Text>
              <Text style={[estilos.celda, estilos.textoEncabezado]}>Retos</Text>
            </View>
            {[...dias].reverse().map((d, i) => (
              <View key={d.fecha} style={[estilos.fila, i % 2 === 1 && { backgroundColor: colores.fondo }]}>
                <Text style={[estilos.celda, estilos.celdaFecha]}>{fechaCorta(d.fecha)}</Text>
                <Text style={estilos.celda}>{d.usuarios_activos}</Text>
                <Text style={estilos.celda}>{d.registros}</Text>
                <Text style={estilos.celda}>
                  {d.retos_iniciados}
                  {d.retos_cumplidos ? ` (${d.retos_cumplidos} ✓)` : ''}
                </Text>
              </View>
            ))}
          </View>
          <Text style={estilos.nota}>Solo se muestran conteos agrupados; no incluye información financiera de ningún usuario.</Text>
        </>
      ) : null}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  rango: { fontSize: 13, color: colores.textoSuave, marginBottom: espacio.md },
  fila: { flexDirection: 'row', paddingHorizontal: espacio.md, paddingVertical: 10 },
  encabezado: { backgroundColor: colores.primarioOscuro },
  textoEncabezado: { color: colores.blanco, fontWeight: '700' },
  celda: { flex: 1, fontSize: 13, color: colores.texto, textAlign: 'right' },
  celdaFecha: { flex: 1.4, textAlign: 'left' },
  nota: { fontSize: 12, color: colores.textoTenue, textAlign: 'center', marginBottom: espacio.lg },
});
