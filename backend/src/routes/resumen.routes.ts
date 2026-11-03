import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { asincrono } from '../utils/errores.js';
import { rangoMes } from '../utils/validaciones.js';

export const resumenRouter = Router();
resumenRouter.use(requiereAuth);

// HU-09 (CA-17, CA-18): dinero disponible del mes = SUM(ingresos) - SUM(gastos)
resumenRouter.get(
  '/disponible',
  asincrono(async (req, res) => {
    const { mes, inicio, fin } = rangoMes(req.query.mes);
    const id = idUsuario(req);

    const { rows } = await pool.query(
      `SELECT
         (SELECT COALESCE(SUM(valor), 0) FROM ingresos
           WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3) AS ingresos,
         (SELECT COALESCE(SUM(valor), 0) FROM gastos
           WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3 AND tipo = 'fijo') AS gastos_fijos,
         (SELECT COALESCE(SUM(valor), 0) FROM gastos
           WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3 AND tipo = 'variable') AS gastos_variables,
         (SELECT COUNT(*) FROM ingresos
           WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3)::int
         + (SELECT COUNT(*) FROM gastos
           WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3)::int AS movimientos`,
      [id, inicio, fin],
    );
    const fila = rows[0];
    const gastos = fila.gastos_fijos + fila.gastos_variables;
    const disponible = fila.ingresos - gastos;

    res.json({
      mes,
      ingresos: fila.ingresos,
      gastos,
      gastosFijos: fila.gastos_fijos,
      gastosVariables: fila.gastos_variables,
      disponible,
      movimientos: fila.movimientos,
      sobregirado: disponible < 0,
    });
  }),
);
