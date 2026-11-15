import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { COLUMNAS_META, enTransaccion, registrarAporte } from '../services/aportes.js';
import { capacidadDelMes, estimarMeta } from '../services/finanzas.js';
import { otorgarLogros } from '../services/logros.js';
import { asincrono, ErrorApi } from '../utils/errores.js';
import { fechaValida, hoy, idValido, lanzarSiHayErrores, texto, valorPositivo } from '../utils/validaciones.js';

export const metasRouter = Router();
metasRouter.use(requiereAuth);

/** HU-18 (CA-35): restante, porcentaje y tiempo estimado (HU-16) de cada meta. */
function conProgreso<T extends { valor_objetivo: number; valor_ahorrado: number }>(meta: T, capacidadMensual: number) {
  return {
    ...meta,
    restante: Math.max(0, meta.valor_objetivo - meta.valor_ahorrado),
    porcentaje: Math.min(100, Math.floor((meta.valor_ahorrado / meta.valor_objetivo) * 100)),
    estimacion: estimarMeta(meta.valor_objetivo, meta.valor_ahorrado, capacidadMensual),
  };
}

function leerAporte(body: unknown) {
  const datos = (body ?? {}) as Record<string, unknown>;
  const valor = valorPositivo(datos.valor);
  const descripcion = texto(datos.descripcion);
  const fecha = datos.fecha === undefined || datos.fecha === '' || datos.fecha === null ? null : fechaValida(datos.fecha);
  const errores: Record<string, string> = {};
  if (valor === null) errores.valor = 'Ingresa un valor numérico mayor que cero.';
  if (datos.fecha && fecha === null) errores.fecha = 'La fecha no es válida.';
  else if (fecha && fecha > hoy()) errores.fecha = 'La fecha no puede estar en el futuro.';
  if (descripcion.length > 150) errores.descripcion = 'La descripción no puede superar 150 caracteres.';
  return { valor, descripcion, fecha, errores };
}

// HU-18: lista de metas con su progreso y tiempo estimado (CA-35, CA-36)
metasRouter.get(
  '/',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    const [{ rows }, capacidad] = await Promise.all([
      pool.query(
        `SELECT ${COLUMNAS_META} FROM metas
         WHERE id_usuario = $1 AND estado <> 'cancelada'
         ORDER BY (estado = 'cumplida'), fecha_creacion DESC`,
        [id],
      ),
      capacidadDelMes(id),
    ]);
    res.json(rows.map((m) => conProgreso(m, capacidad.valor)));
  }),
);

// HU-15: crear meta de ahorro (CA-29, CA-30). HU-23: primera meta creada (CA-45, CA-46)
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

    const id = idUsuario(req);
    const resultado = await enTransaccion(async (cliente) => {
      const { rows } = await cliente.query(
        `INSERT INTO metas (id_usuario, nombre, valor_objetivo, fecha_limite, descripcion)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${COLUMNAS_META}`,
        [id, nombre, valorObjetivo, fechaLimite, descripcion || null],
      );
      const logros = await otorgarLogros(cliente, id, ['primera_meta']);
      return { meta: rows[0], logros };
    });
    res.status(201).json({ ...resultado.meta, logros: resultado.logros });
  }),
);

// HU-20: registrar un gasto evitado y sumarlo a una meta (CA-39, CA-40)
metasRouter.post(
  '/gasto-evitado',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    const { rows: activas } = await pool.query("SELECT 1 FROM metas WHERE id_usuario = $1 AND estado = 'activa' LIMIT 1", [id]);
    if (!activas[0]) {
      throw new ErrorApi(409, 'Primero crea una meta para poder sumarle tus gastos evitados.', { codigo: 'SIN_METAS' });
    }
    const { valor, descripcion, fecha, errores } = leerAporte(req.body);
    if (!descripcion) errores.descripcion = 'Cuéntanos qué gasto evitaste.';
    const idMeta = Number((req.body ?? {}).id_meta);
    if (!Number.isInteger(idMeta) || idMeta <= 0) errores.id_meta = 'Elige la meta a la que se suma el ahorro.';
    lanzarSiHayErrores(errores);

    const resultado = await enTransaccion((cliente) =>
      registrarAporte(cliente, { idUsuario: id, idMeta, valor: valor!, tipo: 'gasto_evitado', descripcion, fecha }),
    );
    res.status(201).json(resultado);
  }),
);

// HU-16 / HU-18: detalle de una meta con sus aportes
metasRouter.get(
  '/:id',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    const idMeta = idValido(req.params.id);
    const [{ rows }, capacidad] = await Promise.all([
      pool.query(`SELECT ${COLUMNAS_META} FROM metas WHERE id = $1 AND id_usuario = $2`, [idMeta, id]),
      capacidadDelMes(id),
    ]);
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos esa meta.');
    const { rows: aportes } = await pool.query(
      `SELECT id, valor, tipo, descripcion, fecha FROM aportes WHERE id_meta = $1 ORDER BY fecha DESC, id DESC`,
      [idMeta],
    );
    res.json({ ...conProgreso(rows[0], capacidad.valor), aportes });
  }),
);

// HU-17: registrar el dinero ahorrado para una meta (CA-33, CA-34)
metasRouter.post(
  '/:id/aportes',
  asincrono(async (req, res) => {
    const idMeta = idValido(req.params.id);
    const { valor, descripcion, fecha, errores } = leerAporte(req.body);
    lanzarSiHayErrores(errores);
    const resultado = await enTransaccion((cliente) =>
      registrarAporte(cliente, {
        idUsuario: idUsuario(req),
        idMeta,
        valor: valor!,
        tipo: 'ahorro',
        descripcion: descripcion || null,
        fecha,
      }),
    );
    res.status(201).json(resultado);
  }),
);
