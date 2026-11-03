import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { asincrono, ErrorApi } from '../utils/errores.js';
import { fechaValida, idValido, lanzarSiHayErrores, rangoMes, texto, valorPositivo } from '../utils/validaciones.js';

export const gastosRouter = Router();
gastosRouter.use(requiereAuth);

const TIPOS = ['fijo', 'variable'];
const SELECT_GASTO = `
  SELECT g.id, g.valor, g.tipo, g.descripcion, g.fecha,
         g.id_categoria, c.nombre AS categoria
  FROM gastos g
  JOIN categorias c ON c.id = g.id_categoria`;

async function leerGasto(body: unknown, idGasto?: number) {
  const datos = (body ?? {}) as Record<string, unknown>;
  const valor = valorPositivo(datos.valor);
  const tipo = texto(datos.tipo).toLowerCase();
  const descripcion = texto(datos.descripcion);
  const fecha = datos.fecha === undefined || datos.fecha === '' ? null : fechaValida(datos.fecha);
  const idCategoria = Number(datos.id_categoria);

  const errores: Record<string, string> = {};
  if (valor === null) errores.valor = 'Ingresa un valor numérico mayor que cero.';
  if (!TIPOS.includes(tipo)) errores.tipo = 'Indica si el gasto es fijo o variable.';
  if (datos.fecha !== undefined && datos.fecha !== '' && fecha === null) errores.fecha = 'La fecha no es válida.';
  if (descripcion.length > 150) errores.descripcion = 'La descripción no puede superar 150 caracteres.';

  // CA-14: la categoría es obligatoria y debe existir. Una categoría desactivada solo se
  // acepta si el gasto que se edita ya la tenía (CA-58: los gastos anteriores la conservan).
  if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
    errores.id_categoria = 'Elige una categoría o usa "Otros".';
  } else {
    const { rows } = await pool.query(
      `SELECT 1 FROM categorias c
       WHERE c.id = $1 AND (c.estado = 'activo'
         OR EXISTS (SELECT 1 FROM gastos g WHERE g.id = $2 AND g.id_categoria = c.id))`,
      [idCategoria, idGasto ?? null],
    );
    if (!rows[0]) errores.id_categoria = 'Elige una categoría o usa "Otros".';
  }
  lanzarSiHayErrores(errores);

  return { valor: valor!, tipo, descripcion: descripcion || null, fecha, idCategoria };
}

// HU-06 (CA-12): gastos del mes (?mes=AAAA-MM&tipo=fijo|variable)
gastosRouter.get(
  '/',
  asincrono(async (req, res) => {
    const { inicio, fin } = rangoMes(req.query.mes);
    const tipo = typeof req.query.tipo === 'string' ? req.query.tipo : '';
    if (tipo && !TIPOS.includes(tipo)) throw new ErrorApi(400, 'El tipo debe ser fijo o variable.');

    const { rows } = await pool.query(
      `${SELECT_GASTO}
       WHERE g.id_usuario = $1 AND g.fecha >= $2 AND g.fecha < $3
         AND ($4::text = '' OR g.tipo = $4)
       ORDER BY g.fecha DESC, g.id DESC`,
      [idUsuario(req), inicio, fin, tipo],
    );
    res.json(rows);
  }),
);

// HU-05 / HU-06 / HU-07: registrar gasto fijo o variable con su categoría
gastosRouter.post(
  '/',
  asincrono(async (req, res) => {
    const gasto = await leerGasto(req.body);
    const { rows } = await pool.query(
      `WITH nuevo AS (
         INSERT INTO gastos (id_usuario, id_categoria, valor, tipo, descripcion, fecha)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
         RETURNING *
       )
       SELECT g.id, g.valor, g.tipo, g.descripcion, g.fecha, g.id_categoria, c.nombre AS categoria
       FROM nuevo g JOIN categorias c ON c.id = g.id_categoria`,
      [idUsuario(req), gasto.idCategoria, gasto.valor, gasto.tipo, gasto.descripcion, gasto.fecha],
    );
    res.status(201).json(rows[0]);
  }),
);

// HU-08 (CA-15): editar gasto, solo si pertenece al usuario del token
gastosRouter.put(
  '/:id',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const gasto = await leerGasto(req.body, id);
    const { rows } = await pool.query(
      `WITH editado AS (
         UPDATE gastos SET id_categoria = $1, valor = $2, tipo = $3, descripcion = $4,
                           fecha = COALESCE($5::date, fecha)
         WHERE id = $6 AND id_usuario = $7
         RETURNING *
       )
       SELECT g.id, g.valor, g.tipo, g.descripcion, g.fecha, g.id_categoria, c.nombre AS categoria
       FROM editado g JOIN categorias c ON c.id = g.id_categoria`,
      [gasto.idCategoria, gasto.valor, gasto.tipo, gasto.descripcion, gasto.fecha, id, idUsuario(req)],
    );
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos ese gasto.');
    res.json(rows[0]);
  }),
);

// HU-08: eliminar gasto
gastosRouter.delete(
  '/:id',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const resultado = await pool.query('DELETE FROM gastos WHERE id = $1 AND id_usuario = $2', [id, idUsuario(req)]);
    if (!resultado.rowCount) throw new ErrorApi(404, 'No encontramos ese gasto.');
    res.status(204).end();
  }),
);
