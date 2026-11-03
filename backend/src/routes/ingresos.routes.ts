import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { asincrono, ErrorApi } from '../utils/errores.js';
import { fechaValida, idValido, lanzarSiHayErrores, rangoMes, texto, valorPositivo } from '../utils/validaciones.js';

export const ingresosRouter = Router();
ingresosRouter.use(requiereAuth);

const TIPOS = ['salario', 'independiente', 'negocio', 'pension', 'otro'];
const COLUMNAS = 'id, valor, tipo, descripcion, fecha';

function leerIngreso(body: unknown) {
  const datos = (body ?? {}) as Record<string, unknown>;
  const valor = valorPositivo(datos.valor);
  const tipo = texto(datos.tipo).toLowerCase();
  const descripcion = texto(datos.descripcion);
  const fecha = datos.fecha === undefined || datos.fecha === '' ? null : fechaValida(datos.fecha);

  const errores: Record<string, string> = {};
  if (valor === null) errores.valor = 'Ingresa un valor numérico mayor que cero.';
  if (!TIPOS.includes(tipo)) errores.tipo = 'Selecciona el tipo de ingreso.';
  if (datos.fecha !== undefined && datos.fecha !== '' && fecha === null) errores.fecha = 'La fecha no es válida.';
  if (descripcion.length > 150) errores.descripcion = 'La descripción no puede superar 150 caracteres.';
  lanzarSiHayErrores(errores);

  return { valor: valor!, tipo, descripcion: descripcion || null, fecha };
}

// Lista de ingresos del mes (?mes=AAAA-MM)
ingresosRouter.get(
  '/',
  asincrono(async (req, res) => {
    const { inicio, fin } = rangoMes(req.query.mes);
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS} FROM ingresos
       WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3
       ORDER BY fecha DESC, id DESC`,
      [idUsuario(req), inicio, fin],
    );
    res.json(rows);
  }),
);

// HU-04: registrar ingreso (CA-07, CA-08)
ingresosRouter.post(
  '/',
  asincrono(async (req, res) => {
    const ingreso = leerIngreso(req.body);
    const { rows } = await pool.query(
      `INSERT INTO ingresos (id_usuario, valor, tipo, descripcion, fecha)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE))
       RETURNING ${COLUMNAS}`,
      [idUsuario(req), ingreso.valor, ingreso.tipo, ingreso.descripcion, ingreso.fecha],
    );
    res.status(201).json(rows[0]);
  }),
);

// HU-08: editar ingreso (solo si pertenece al usuario del token)
ingresosRouter.put(
  '/:id',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const ingreso = leerIngreso(req.body);
    const { rows } = await pool.query(
      `UPDATE ingresos SET valor = $1, tipo = $2, descripcion = $3, fecha = COALESCE($4::date, fecha)
       WHERE id = $5 AND id_usuario = $6
       RETURNING ${COLUMNAS}`,
      [ingreso.valor, ingreso.tipo, ingreso.descripcion, ingreso.fecha, id, idUsuario(req)],
    );
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos ese ingreso.');
    res.json(rows[0]);
  }),
);

// HU-08: eliminar ingreso (CA-16; la confirmación se hace en la app)
ingresosRouter.delete(
  '/:id',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const resultado = await pool.query('DELETE FROM ingresos WHERE id = $1 AND id_usuario = $2', [id, idUsuario(req)]);
    if (!resultado.rowCount) throw new ErrorApi(404, 'No encontramos ese ingreso.');
    res.status(204).end();
  }),
);
