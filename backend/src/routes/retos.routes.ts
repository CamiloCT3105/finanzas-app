import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { enTransaccion, registrarAporte } from '../services/aportes.js';
import { otorgarLogros } from '../services/logros.js';
import { asincrono, ErrorApi } from '../utils/errores.js';
import { idValido, lanzarSiHayErrores, texto, valorPositivo } from '../utils/validaciones.js';

export const retosRouter = Router();
retosRouter.use(requiereAuth);

const SELECT_RETO_USUARIO = `
  SELECT ru.id, ru.id_reto, r.nombre, r.descripcion, r.objetivo, r.duracion_dias, r.condiciones,
         ru.fecha_inicio, ru.fecha_fin, ru.estado, ru.fecha_cumplimiento,
         COALESCE((SELECT SUM(a.valor) FROM aportes a WHERE a.id_reto_usuario = ru.id), 0) AS ahorrado,
         GREATEST(ru.fecha_fin - CURRENT_DATE + 1, 0) AS dias_restantes
  FROM retos_usuario ru JOIN retos r ON r.id = ru.id_reto`;

/** CA-42: los retos activos cuyo plazo ya pasó quedan como no cumplidos. */
async function cerrarVencidos(idUsuario: number) {
  await pool.query(
    `UPDATE retos_usuario SET estado = 'no_cumplido'
     WHERE id_usuario = $1 AND estado = 'activo' AND fecha_fin < CURRENT_DATE`,
    [idUsuario],
  );
}

async function retoActivo(idUsuario: number) {
  const { rows } = await pool.query(`${SELECT_RETO_USUARIO} WHERE ru.id_usuario = $1 AND ru.estado = 'activo'`, [idUsuario]);
  return rows[0] ?? null;
}

// HU-19 (CA-37): retos disponibles, el reto activo y el historial del usuario
retosRouter.get(
  '/',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    await cerrarVencidos(id);
    const [disponibles, activo, historial] = await Promise.all([
      pool.query(
        `SELECT id, nombre, descripcion, objetivo, duracion_dias, condiciones FROM retos
         WHERE estado = 'activo' ORDER BY duracion_dias, objetivo`,
      ),
      retoActivo(id),
      pool.query(
        `${SELECT_RETO_USUARIO} WHERE ru.id_usuario = $1 AND ru.estado <> 'activo'
         ORDER BY ru.fecha_inicio DESC, ru.id DESC LIMIT 20`,
        [id],
      ),
    ]);
    res.json({ disponibles: disponibles.rows, activo, historial: historial.rows });
  }),
);

// HU-19 (CA-38): iniciar un reto; la fecha de fin se calcula según su duración
retosRouter.post(
  '/:id/iniciar',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    const idReto = idValido(req.params.id);
    await cerrarVencidos(id);
    if (await retoActivo(id)) {
      throw new ErrorApi(409, 'Ya tienes un reto activo. Complétalo o abandónalo antes de iniciar otro.');
    }
    const { rows: retos } = await pool.query("SELECT duracion_dias FROM retos WHERE id = $1 AND estado = 'activo'", [idReto]);
    if (!retos[0]) throw new ErrorApi(404, 'Ese reto ya no está disponible.');
    try {
      await pool.query(
        `INSERT INTO retos_usuario (id_usuario, id_reto, fecha_inicio, fecha_fin)
         VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + $3::int - 1)`,
        [id, idReto, retos[0].duracion_dias],
      );
    } catch (error) {
      // El índice único parcial impide dos retos activos si llegan dos peticiones a la vez.
      if ((error as { code?: string }).code === '23505') {
        throw new ErrorApi(409, 'Ya tienes un reto activo. Complétalo o abandónalo antes de iniciar otro.');
      }
      throw error;
    }
    res.status(201).json(await retoActivo(id));
  }),
);

// HU-21: registrar avance del reto; lo ahorrado se suma a una meta
retosRouter.post(
  '/activo/avance',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    await cerrarVencidos(id);
    const activo = await retoActivo(id);
    if (!activo) throw new ErrorApi(404, 'No tienes un reto activo.');

    const datos = (req.body ?? {}) as Record<string, unknown>;
    const valor = valorPositivo(datos.valor);
    const descripcion = texto(datos.descripcion);
    const idMeta = Number(datos.id_meta);
    const errores: Record<string, string> = {};
    if (valor === null) errores.valor = 'Ingresa un valor numérico mayor que cero.';
    if (!Number.isInteger(idMeta) || idMeta <= 0) errores.id_meta = 'Elige la meta a la que se suma lo ahorrado.';
    if (descripcion.length > 150) errores.descripcion = 'La descripción no puede superar 150 caracteres.';
    lanzarSiHayErrores(errores);

    const resultado = await enTransaccion((cliente) =>
      registrarAporte(cliente, {
        idUsuario: id,
        idMeta,
        valor: valor!,
        tipo: 'reto',
        descripcion: descripcion || `Avance: ${activo.nombre}`,
        fecha: null,
        idRetoUsuario: activo.id,
      }),
    );
    res.status(201).json({ ...resultado, reto: await retoActivo(id) });
  }),
);

// HU-21 (CA-41): marcar el reto como cumplido si se alcanzó el objetivo dentro del plazo
retosRouter.post(
  '/activo/completar',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    await cerrarVencidos(id);
    const activo = await retoActivo(id);
    if (!activo) throw new ErrorApi(404, 'No tienes un reto activo o su plazo ya terminó.');
    if (activo.ahorrado < activo.objetivo) {
      const falta = activo.objetivo - activo.ahorrado;
      throw new ErrorApi(400, `Aún no cumples el objetivo: te faltan $${Math.ceil(falta).toLocaleString('es-CO')}.`);
    }
    const resultado = await enTransaccion(async (cliente) => {
      await cliente.query(
        `UPDATE retos_usuario SET estado = 'cumplido', fecha_cumplimiento = CURRENT_DATE
         WHERE id = $1 AND fecha_fin >= CURRENT_DATE`,
        [activo.id],
      );
      return otorgarLogros(cliente, id, ['reto_cumplido']);
    });
    const { rows } = await pool.query(`${SELECT_RETO_USUARIO} WHERE ru.id = $1`, [activo.id]);
    res.json({ reto: rows[0], logros: resultado });
  }),
);

// Abandonar el reto activo para poder elegir otro
retosRouter.post(
  '/activo/abandonar',
  asincrono(async (req, res) => {
    const resultado = await pool.query(
      "UPDATE retos_usuario SET estado = 'abandonado' WHERE id_usuario = $1 AND estado = 'activo'",
      [idUsuario(req)],
    );
    if (!resultado.rowCount) throw new ErrorApi(404, 'No tienes un reto activo.');
    res.status(204).end();
  }),
);
