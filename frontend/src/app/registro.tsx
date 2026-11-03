import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Aviso } from '@/components/Aviso';
import { Boton } from '@/components/Boton';
import { Campo } from '@/components/Campo';
import { EncabezadoAuth, estilosAuth as estilos } from '@/components/EncabezadoAuth';
import { Pantalla } from '@/components/Pantalla';
import { useSesion } from '@/context/sesion';
import { ErrorApi, mensajeError } from '@/lib/api';

type Errores = Partial<Record<'nombre' | 'correo' | 'contrasena' | 'confirmacion', string>>;

function validar(nombre: string, correo: string, contrasena: string, confirmacion: string): Errores {
  const errores: Errores = {};
  if (nombre.trim().length < 2) errores.nombre = 'Ingresa tu nombre (mínimo 2 caracteres).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) errores.correo = 'Ingresa un correo válido.';
  if (contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
  else if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena))
    errores.contrasena = 'La contraseña debe combinar letras y números.';
  if (confirmacion !== contrasena) errores.confirmacion = 'Las contraseñas no coinciden.';
  return errores;
}

// HU-01: crear cuenta con nombre, correo y contraseña.
export default function Registro() {
  const { registrarse } = useSesion();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    const encontrados = validar(nombre, correo, contrasena, confirmacion);
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      // CA-01: al crear la cuenta se entra directamente a la aplicación.
      await registrarse(nombre.trim(), correo.trim(), contrasena);
    } catch (e) {
      // CA-02: correo ya registrado → se muestra el mensaje sobre el campo correo.
      if (e instanceof ErrorApi && Object.keys(e.campos).length) setErrores(e.campos);
      setErrorGeneral(mensajeError(e));
      setEnviando(false);
    }
  };

  return (
    <Pantalla bordes={['top', 'bottom']}>
      <EncabezadoAuth titulo="Crea tu cuenta" subtitulo="Lleva el control de tu dinero de forma personal y segura." />
      <View style={estilos.tarjeta}>
        {errorGeneral ? <Aviso mensaje={errorGeneral} /> : null}
        <Campo
          etiqueta="Nombre"
          icono="person-outline"
          value={nombre}
          onChangeText={setNombre}
          placeholder="¿Cómo te llamas?"
          autoComplete="name"
          textContentType="name"
          error={errores.nombre}
          maxLength={100}
        />
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
          error={errores.correo}
        />
        <Campo
          etiqueta="Contraseña"
          icono="lock-closed-outline"
          value={contrasena}
          onChangeText={setContrasena}
          placeholder="Mínimo 8 caracteres"
          contrasena
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          error={errores.contrasena}
          ayuda="Usa al menos 8 caracteres combinando letras y números."
        />
        <Campo
          etiqueta="Confirmar contraseña"
          icono="shield-checkmark-outline"
          value={confirmacion}
          onChangeText={setConfirmacion}
          placeholder="Repite tu contraseña"
          contrasena
          autoCapitalize="none"
          error={errores.confirmacion}
          returnKeyType="go"
          onSubmitEditing={enviar}
        />
        <Boton titulo="Crear cuenta" onPress={enviar} cargando={enviando} icono="person-add-outline" />
      </View>
      <View style={estilos.pie}>
        <Text style={estilos.pieTexto}>¿Ya tienes cuenta? </Text>
        <Link href="/login" replace style={estilos.enlace}>
          Inicia sesión
        </Link>
      </View>
    </Pantalla>
  );
}
