import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { EncabezadoAdmin, estilosAdmin, Indicador, OpcionMenu } from '@/components/Admin';
import { Aviso } from '@/components/Aviso';
import { BarraProgreso } from '@/components/BarraProgreso';
import { Pantalla } from '@/components/Pantalla';
import { useSesion } from '@/context/sesion';
import { useDatos } from '@/hooks/useDatos';
import { api } from '@/lib/api';
import type { DashboardAdmin } from '@/lib/tipos';
import { colores, espacio } from '@/theme';

// HU-28: indicadores generales de la plataforma (CA-55). Se recargan al volver a la pantalla (CA-56).
export default function ResumenAdmin() {
  const { usuario } = useSesion();
  const { datos, error, cargando, refrescando, recargar } = useDatos(() => api.get<DashboardAdmin>('/admin/dashboard'));
  const porcentajeActivos = datos && datos.total_usuarios > 0 ? (datos.activos / datos.total_usuarios) * 100 : 0;

  return (
    <Pantalla refrescando={refrescando} alRefrescar={recargar}>
      <EncabezadoAdmin titulo={`Hola, ${usuario?.nombre.split(' ')[0] ?? ''}`} subtitulo="Así está la plataforma hoy." />
      {error ? <Aviso mensaje={error} /> : null}
      {cargando && !datos ? (
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.xxl }} />
      ) : datos ? (
        <>
          <View style={estilosAdmin.grilla}>
            <Indicador etiqueta="Usuarios registrados" valor={datos.total_usuarios} icono="people" color={colores.primarioOscuro} fondo="#E0ECF4" detalle={`${datos.administradores} administradores`} />
            <Indicador etiqueta="Cuentas activas" valor={datos.activos} icono="checkmark-circle" color="#15803D" fondo="#DCFCE7" />
            <Indicador etiqueta="Cuentas inactivas" valor={datos.inactivos} icono="close-circle" color="#B91C1C" fondo="#FEE2E2" />
            <Indicador etiqueta="Retos disponibles" valor={datos.retos_disponibles} icono="trophy" color="#EA580C" fondo="#FFEDD5" detalle={`${datos.retos_en_curso} en curso`} />
          </View>

          <View style={[estilosAdmin.tarjeta, { marginTop: espacio.md }]}>
            <Text style={estilosAdmin.nombre}>Cuentas activas</Text>
            <Text style={[estilosAdmin.detalle, { marginBottom: espacio.sm }]}>
              {datos.activos} de {datos.total_usuarios} cuentas ({Math.round(porcentajeActivos)} %) · {datos.activos_7_dias} usaron la app en los
              últimos 7 días
            </Text>
            <BarraProgreso porcentaje={porcentajeActivos} color="#15803D" fondo="#FEE2E2" alto={10} />
          </View>

          <Text style={estilosAdmin.seccion}>Accesos rápidos</Text>
          <View style={[estilosAdmin.tarjeta, { padding: espacio.xs }]}>
            <OpcionMenu titulo="Usuarios" detalle="Buscar, activar o desactivar cuentas y asignar roles" icono="people-outline" onPress={() => router.navigate('/admin/usuarios')} />
            <OpcionMenu
              titulo="Solicitudes de soporte"
              detalle="Dar seguimiento a los problemas de los usuarios"
              icono="help-buoy-outline"
              contador={datos.solicitudes_abiertas}
              onPress={() => router.push('/admin/soporte')}
            />
            <OpcionMenu titulo="Actividad" detalle="Usuarios activos y participación por día" icono="pulse-outline" onPress={() => router.push('/admin/actividad')} />
            <OpcionMenu titulo="Reportes" detalle="Usuarios y participación en retos por período" icono="bar-chart-outline" onPress={() => router.push('/admin/reportes')} />
          </View>
        </>
      ) : null}
    </Pantalla>
  );
}
