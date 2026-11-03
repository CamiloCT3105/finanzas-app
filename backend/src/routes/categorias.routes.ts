import { Router } from 'express';
import { pool } from '../config/db.js';
import { requiereAuth } from '../middleware/auth.js';
import { asincrono } from '../utils/errores.js';

export const categoriasRouter = Router();
categoriasRouter.use(requiereAuth);

// HU-07 (CA-13): solo las categorías activas, en el orden en que se cargaron.
categoriasRouter.get(
  '/',
  asincrono(async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT id, nombre, descripcion FROM categorias WHERE estado = 'activo' ORDER BY id",
    );
    res.json(rows);
  }),
);
