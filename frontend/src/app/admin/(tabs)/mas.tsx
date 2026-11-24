import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { EncabezadoAdmin, estilosAdmin, OpcionMenu } from '@/components/Admin';
import { Boton } from '@/components/Boton';
import { Dialogo } from '@/components/Dialogo';
import { Pantalla } from '@/components/Pantalla';
import { useSesion } from '@/context/sesion';
import { espacio } from '@/theme';

export default function MasAdmin() {
  const { usuario, cerrarSesion } = useSesion();
  const [confirmar, setConfirmar] = useState(false);
  return (
    <Pantalla>
      <EncabezadoAdmin titulo="Más opciones" />
      <View style={[estilosAdmin.tarjeta, { padding: espacio.xs }]}>
        <OpcionMenu titulo="Actividad de la plataforma" detalle="Usuarios activos y participación por día" icono="pulse-outline" onPress={() => router.push('/admin/actividad')} />
        <OpcionMenu titulo="Reportes" detalle="Usuarios registrados, activos y retos por período" icono="bar-chart-outline" onPress={() => router.push('/admin/reportes')} />
        <OpcionMenu titulo="Solicitudes de soporte" detalle="Ver y dar seguimiento a los problemas" icono="help-buoy-outline" onPress={() => router.push('/admin/soporte')} />
      </View>

      <Text style={estilosAdmin.seccion}>Sesión</Text>
      <View style={estilosAdmin.tarjeta}>
        <Text style={estilosAdmin.nombre}>{usuario?.nombre}</Text>
        <Text style={[estilosAdmin.detalle, { marginBottom: espacio.lg }]}>{usuario?.correo} · Administrador</Text>
        <Boton titulo="Cerrar sesión" variante="peligro" icono="log-out-outline" onPress={() => setConfirmar(true)} />
      </View>

      <Dialogo
        visible={confirmar}
        titulo="¿Cerrar sesión?"
        mensaje="Tendrás que ingresar tus datos de nuevo para volver al panel."
        textoConfirmar="Cerrar sesión"
        icono="log-out-outline"
        peligro
        alCancelar={() => setConfirmar(false)}
        alConfirmar={() => {
          setConfirmar(false);
          void cerrarSesion();
        }}
      />
    </Pantalla>
  );
}
