import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fechaISO, hoyISO } from '@/lib/formato';
import { espacio } from '@/theme';
import { Chips } from './Opciones';
import { SelectorFecha } from './SelectorFecha';

export interface Periodo {
  desde: string;
  hasta: string;
}

type Atajo = '7' | '30' | 'mes' | 'anterior' | 'otro';

function calcular(atajo: Exclude<Atajo, 'otro'>): Periodo {
  const hoy = new Date();
  if (atajo === '7' || atajo === '30') {
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - (Number(atajo) - 1));
    return { desde: fechaISO(desde), hasta: hoyISO() };
  }
  if (atajo === 'mes') return { desde: fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: hoyISO() };
  return {
    desde: fechaISO(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
    hasta: fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 0)),
  };
}

export const periodoInicial = (): Periodo => calcular('7');

/** Rango de fechas con atajos (últimos 7 o 30 días, este mes, mes anterior) o fechas personalizadas. */
export function SelectorPeriodo({ periodo, alCambiar }: { periodo: Periodo; alCambiar: (p: Periodo) => void }) {
  const [atajo, setAtajo] = useState<Atajo>('7');
  return (
    <View style={estilos.contenedor}>
      <Chips
        opciones={[
          { valor: '7', etiqueta: '7 días' },
          { valor: '30', etiqueta: '30 días' },
          { valor: 'mes', etiqueta: 'Este mes' },
          { valor: 'anterior', etiqueta: 'Mes anterior' },
          { valor: 'otro', etiqueta: 'Otro' },
        ]}
        valor={atajo}
        alCambiar={(a) => {
          setAtajo(a);
          if (a !== 'otro') alCambiar(calcular(a));
        }}
      />
      {atajo === 'otro' ? (
        <View style={estilos.fechas}>
          <View style={{ flex: 1 }}>
            <SelectorFecha etiqueta="Desde" valor={periodo.desde} alCambiar={(d) => d && alCambiar({ ...periodo, desde: d })} />
          </View>
          <View style={{ flex: 1 }}>
            <SelectorFecha etiqueta="Hasta" valor={periodo.hasta} alCambiar={(d) => d && alCambiar({ ...periodo, hasta: d })} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginBottom: espacio.lg, gap: espacio.md },
  fechas: { flexDirection: 'row', gap: espacio.md },
});
