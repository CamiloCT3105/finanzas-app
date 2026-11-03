import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { asincrono } from '../utils/errores.js';
import { fechaValida, hoy, lanzarSiHayErrores, texto, valorPositivo } from '../utils/validaciones.js';

export const metasRouter = Router();
metasRouter.use(requiereAuth);

const COLUMNAS = 'id, nombre, valor_objetivo, valor_ahorrado, fecha_limite, descripcion, estado, fecha_creacion';

// Lista de metas del usuario
metasRouter.get(
  '/',
  asincrono(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS} FROM metas
       WHERE id_usuario = $1 AND estado <> 'cancelada'
       ORDER BY (estado = 'cumplida'), fecha_creacion DESC`,
      [idUsuario(req)],
    );
    res.json(rows);
  }),
);

// HU-15: crear meta de ahorro (CA-29, CA-30)
metasRouter.post(
  '/',
  asincrono(async (req, res) => {
    const datos = (req.body ?? {}) as Record<string, unknown>;
    const nombre = texto(datos.nombre);
    const valorTexto = texto(typeof datos.valor_objetivo === 'number' ? String(datos.valor_objetivo) : datos.valor_objetivo);
    const valorObjetivo = valorPositivo(datos.valor_objetivo);
    const descripcion = texto(datos.descripcion);
    const hayFecha = datos.fecha_limite !== undefined && datos.fecha_limite !== null && datos.fecha_limite !== '';
    const fechaLimite = hayFecha ? fechaValida(datos.fecha_limite) : null;

    // Se reportan todos los campos que faltan a la vez para mostrarlos en el formulario.
    const errores: Record<string, string> = {};
    if (!nombre) errores.nombre = 'El nombre de la meta es obligatorio.';
    else if (nombre.length > 100) errores.nombre = 'El nombre no puede superar 100 caracteres.';
    if (!valorTexto) errores.valor_objetivo = 'El valor objetivo es obligatorio.';
    else if (valorObjetivo === null) errores.valor_objetivo = 'El valor objetivo debe ser un número mayor que cero.';
    if (hayFecha && fechaLimite === null) errores.fecha_limite = 'La fecha límite no es válida.';
    else if (fechaLimite && fechaLimite < hoy())
      errores.fecha_limite = 'La fecha límite no puede estar en el pasado.';
    if (descripcion.length > 255) errores.descripcion = 'La descripción no puede superar 255 caracteres.';
    lanzarSiHayErrores(
      errores,
      !nombre && !valorTexto ? 'Faltan campos obligatorios: nombre y valor objetivo.' : undefined,
    );

    const { rows } = await pool.query(
      `INSERT INTO metas (id_usuario, nombre, valor_objetivo, fecha_limite, descripcion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNAS}`,
      [idUsuario(req), nombre, valorObjetivo, fechaLimite, descripcion || null],
    );
    res.status(201).json(rows[0]);
  }),
);
