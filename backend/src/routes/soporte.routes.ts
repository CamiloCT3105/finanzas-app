import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { asincrono } from '../utils/errores.js';
import { lanzarSiHayErrores, texto } from '../utils/validaciones.js';

export const soporteRouter = Router();
soporteRouter.use(requiereAuth);

// HU-34 (lado del usuario): mis solicitudes de soporte
soporteRouter.get(
  '/',
  asincrono(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, asunto, descripcion, estado, anotacion, fecha, fecha_actualizacion
       FROM solicitudes_soporte WHERE id_usuario = $1 ORDER BY fecha DESC`,
      [idUsuario(req)],
    );
    res.json(rows);
  }),
);

soporteRouter.post(
  '/',
  asincrono(async (req, res) => {
    const asunto = texto(req.body?.asunto);
    const descripcion = texto(req.body?.descripcion);
    const errores: Record<string, string> = {};
    if (asunto.length < 4) errores.asunto = 'Escribe un asunto (mínimo 4 caracteres).';
    else if (asunto.length > 120) errores.asunto = 'El asunto no puede superar 120 caracteres.';
    if (descripcion.length < 10) errores.descripcion = 'Describe el problema (mínimo 10 caracteres).';
    else if (descripcion.length > 1000) errores.descripcion = 'La descripción no puede superar 1000 caracteres.';
    lanzarSiHayErrores(errores);
    const { rows } = await pool.query(
      `INSERT INTO solicitudes_soporte (id_usuario, asunto, descripcion) VALUES ($1, $2, $3)
       RETURNING id, asunto, descripcion, estado, anotacion, fecha, fecha_actualizacion`,
      [idUsuario(req), asunto, descripcion],
    );
    res.status(201).json(rows[0]);
  }),
);
