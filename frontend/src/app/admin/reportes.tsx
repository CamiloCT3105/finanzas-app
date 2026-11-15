import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { estilosAdmin, Indicador } from '@/components/Admin';
import { Aviso } from '@/components/Aviso';
import { BarraProgreso } from '@/components/BarraProgreso';
import { Pantalla } from '@/components/Pantalla';
import { periodoInicial, SelectorPeriodo, type Periodo } from '@/components/SelectorPeriodo';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import { fechaCorta, porcentaje } from '@/lib/formato';
import type { Reporte } from '@/lib/tipos';
import { colores, espacio } from '@/theme';

// HU-33: reportes de usuarios y participación en retos por período (CA-65, CA-66).
export default function ReportesAdmin() {
  const [periodo, setPeriodo] = useState<Periodo>(periodoInicial);
  const { datos: r, error, cargando } = useDatos(
    () => api.get<Reporte>(`/admin/reportes?desde=${periodo.desde}&hasta=${periodo.hasta}`),
    `${periodo.desde}:${periodo.hasta}`,
  );

  return (
    <Pantalla bordes={['bottom']}>
      <SelectorPeriodo periodo={periodo} alCambiar={setPeriodo} />
      {error ? <Aviso mensaje={error} /> : null}
      {cargando && !r ? (
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xl }} />
      ) : r ? (
        r.sinDatos ? (
          // CA-66: período sin registros
          <View style={[estilosAdmin.tarjeta, estilos.vacio]}>
            <Ionicons name="document-text-outline" size={32} color={colores.textoTenue} />
            <Text style={estilosAdmin.nombre}>No hay información para este período</Text>
            <Text style={[estilosAdmin.detalle, { textAlign: 'center' }]}>
              Entre el {fechaCorta(r.desde)} y el {fechaCorta(r.hasta)} no hubo registros, actividad ni retos iniciados.
            </Text>
          </View>
        ) : (
          <>
            <Text style={estilos.rango}>
              Del {fechaCorta(r.desde)} al {fechaCorta(r.hasta)}
            </Text>
            <View style={estilosAdmin.grilla}>
              <Indicador etiqueta="Usuarios registrados" valor={r.registrados} icono="person-add" color="#15803D" fondo="#DCFCE7" />
              <Indicador etiqueta="Usuarios activos" valor={r.activos} icono="pulse" color={colores.primarioOscuro} fondo="#E0ECF4" />
              <Indicador etiqueta="Participaron en retos" valor={r.participantes_retos} icono="trophy" color="#EA580C" fondo="#FFEDD5" />
            </View>

            <Text style={estilosAdmin.seccion}>Participación en retos</Text>
            {r.participacion.length === 0 ? (
              <Text style={estilosAdmin.detalle}>Nadie inició retos en este período.</Text>
            ) : (
              r.participacion.map((p) => (
                <View key={p.id} style={[estilosAdmin.tarjeta, { gap: espacio.sm }]}>
                  <View style={estilosAdmin.fila}>
                    <Text style={[estilosAdmin.nombre, { flex: 1 }]}>{p.nombre}</Text>
                    <Text style={estilos.tasa}>{porcentaje(p.tasa_cumplimiento)}</Text>
                  </View>
                  <BarraProgreso porcentaje={p.tasa_cumplimiento} color="#15803D" alto={8} />
                  <View style={estilos.cifras}>
                    <Cifra etiqueta="Iniciados" valor={p.iniciados} />
                    <Cifra etiqueta="Cumplidos" valor={p.cumplidos} color="#15803D" />
                    <Cifra etiqueta="No cumplidos" valor={p.no_cumplidos} color="#B91C1C" />
                    <Cifra etiqueta="En curso" valor={p.en_curso} color="#EA580C" />
                  </View>
                </View>
              ))
            )}
          </>
        )
      ) : null}
    </Pantalla>
  );
}

function Cifra({ etiqueta, valor, color = colores.texto }: { etiqueta: string; valor: number; color?: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[estilos.cifraValor, { color }]}>{valor}</Text>
      <Text style={estilos.cifraEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  rango: { fontSize: 13, color: colores.textoSuave, marginBottom: espacio.md },
  vacio: { alignItems: 'center', gap: espacio.sm, paddingVertical: espacio.xl },
  tasa: { fontSize: 16, fontWeight: '800', color: '#15803D' },
  cifras: { flexDirection: 'row' },
  cifraValor: { fontSize: 18, fontWeight: '800' },
  cifraEtiqueta: { fontSize: 11, color: colores.textoSuave },
});
