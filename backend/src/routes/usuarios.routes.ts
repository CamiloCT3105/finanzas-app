import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { asincrono, ErrorApi } from '../utils/errores.js';
import { esCorreo, lanzarSiHayErrores, texto } from '../utils/validaciones.js';

export const usuariosRouter = Router();
usuariosRouter.use(requiereAuth);

const COLUMNAS_PUBLICAS = 'id, nombre, correo, rol, estado, fecha_registro';

// HU-03: ver mi perfil
usuariosRouter.get(
  '/perfil',
  asincrono(async (req, res) => {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`, [idUsuario(req)]);
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos tu cuenta.');
    res.json(rows[0]);
  }),
);

// HU-03: modificar mi perfil (CA-05). Solo actualiza el registro del usuario del token.
usuariosRouter.put(
  '/perfil',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    const nombre = texto(req.body?.nombre);
    const correo = texto(req.body?.correo).toLowerCase();

    const errores: Record<string, string> = {};
    if (nombre.length < 2) errores.nombre = 'Ingresa tu nombre (mínimo 2 caracteres).';
    else if (nombre.length > 100) errores.nombre = 'El nombre no puede superar 100 caracteres.';
    if (!esCorreo(correo)) errores.correo = 'Ingresa un correo válido.';
    lanzarSiHayErrores(errores);

    const enUso = await pool.query('SELECT 1 FROM usuarios WHERE correo = $1 AND id <> $2', [correo, id]);
    if (enUso.rowCount) {
      throw new ErrorApi(409, 'Este correo ya está registrado.', { correo: 'Este correo ya está registrado.' });
    }

    const { rows } = await pool.query(
      `UPDATE usuarios SET nombre = $1, correo = $2 WHERE id = $3 RETURNING ${COLUMNAS_PUBLICAS}`,
      [nombre, correo, id],
    );
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos tu cuenta.');
    res.json(rows[0]);
  }),
);
