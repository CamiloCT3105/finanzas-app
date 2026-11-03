import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { EncabezadoAuth, estilosAuth as estilos } from '@/components/EncabezadoAuth';
import { Pantalla } from '@/components/Pantalla';
import { useSesion } from '@/context/sesion';
import { mensajeError } from '@/lib/api';

// HU-02: iniciar sesión con correo y contraseña.
export default function Login() {
  const { iniciarSesion } = useSesion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!correo.trim() || !contrasena) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), contrasena);
    } catch (e) {
      // CA-04: el mensaje es genérico, no dice si falló el correo o la contraseña.
      setError(mensajeError(e));
      setEnviando(false);
    }
  };

  return (
    <Pantalla bordes={['top', 'bottom']}>
      <EncabezadoAuth titulo="Bienvenido de nuevo" subtitulo="Inicia sesión para ver y manejar tus finanzas." />
      <View style={estilos.tarjeta}>
        {error ? <Aviso mensaje={error} /> : null}
        <Campo
          etiqueta="Correo electrónico"
          icono="mail-outline"
          value={correo}
          onChangeText={setCorreo}
          placeholder="tucorreo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <Campo
          etiqueta="Contraseña"
          icono="lock-closed-outline"
          value={contrasena}
          onChangeText={setContrasena}
          placeholder="Tu contraseña"
          contrasena
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={enviar}
        />
        <Boton titulo="Iniciar sesión" onPress={enviar} cargando={enviando} icono="log-in-outline" />
      </View>
      <View style={estilos.pie}>
        <Text style={estilos.pieTexto}>¿No tienes cuenta? </Text>
        <Link href="/registro" replace style={estilos.enlace}>
          Crear cuenta
        </Link>
      </View>
    </Pantalla>
  );
}
