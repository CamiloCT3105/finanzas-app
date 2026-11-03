import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { pool } from '../config/db.js';
import { firmarToken } from '../middleware/auth.js';
import { asincrono, ErrorApi } from '../utils/errores.js';
import { esCorreo, lanzarSiHayErrores, texto } from '../utils/validaciones.js';

export const authRouter = Router();

const COLUMNAS_PUBLICAS = 'id, nombre, correo, rol, estado, fecha_registro';

// HU-01: crear cuenta (CA-01, CA-02)
authRouter.post(
  '/registro',
  asincrono(async (req, res) => {
    const nombre = texto(req.body?.nombre);
    const correo = texto(req.body?.correo).toLowerCase();
    const contrasena = typeof req.body?.contrasena === 'string' ? req.body.contrasena : '';

    const errores: Record<string, string> = {};
    if (nombre.length < 2) errores.nombre = 'Ingresa tu nombre (mínimo 2 caracteres).';
    else if (nombre.length > 100) errores.nombre = 'El nombre no puede superar 100 caracteres.';
    if (!esCorreo(correo)) errores.correo = 'Ingresa un correo válido.';
    if (contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
    else if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena))
      errores.contrasena = 'La contraseña debe combinar letras y números.';
    lanzarSiHayErrores(errores);

    const existente = await pool.query('SELECT 1 FROM usuarios WHERE correo = $1', [correo]);
    if (existente.rowCount) {
      throw new ErrorApi(409, 'Este correo ya está registrado.', { correo: 'Este correo ya está registrado.' });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    try {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (nombre, correo, contrasena) VALUES ($1, $2, $3) RETURNING ${COLUMNAS_PUBLICAS}`,
        [nombre, correo, hash],
      );
      const usuario = rows[0];
      res.status(201).json({ token: firmarToken(usuario), usuario });
    } catch (error) {
      // Dos registros simultáneos con el mismo correo: la restricción UNIQUE lo impide.
      if ((error as { code?: string }).code === '23505') {
        throw new ErrorApi(409, 'Este correo ya está registrado.', { correo: 'Este correo ya está registrado.' });
      }
      throw error;
    }
  }),
);

// HU-02: iniciar sesión (CA-03, CA-04)
authRouter.post(
  '/login',
  asincrono(async (req, res) => {
    const correo = texto(req.body?.correo).toLowerCase();
    const contrasena = typeof req.body?.contrasena === 'string' ? req.body.contrasena : '';
    if (!correo || !contrasena) {
      throw new ErrorApi(400, 'Ingresa tu correo y tu contraseña.');
    }

    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS}, contrasena FROM usuarios WHERE correo = $1`, [
      correo,
    ]);
    const encontrado = rows[0];
    const coincide = encontrado ? await bcrypt.compare(contrasena, encontrado.contrasena) : false;
    if (!encontrado || !coincide) {
      // Mensaje genérico: no revela si falló el correo o la contraseña.
      throw new ErrorApi(401, 'Correo o contraseña incorrectos.');
    }
    if (encontrado.estado !== 'activo') {
      throw new ErrorApi(403, 'Tu cuenta está desactivada. Comunícate con soporte.');
    }

    const { contrasena: _hash, ...usuario } = encontrado;
    res.json({ token: firmarToken(usuario), usuario });
  }),
);
