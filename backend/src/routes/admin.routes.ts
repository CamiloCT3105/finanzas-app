// Panel administrativo (HU-24 a HU-34). Ninguna consulta de este archivo lee las tablas
// ingresos, gastos, metas ni aportes: el administrador nunca ve información financiera (CA-54, CA-62).
import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAdmin, requiereAuth } from '../middleware/auth.js';
import { enTransaccion } from '../services/aportes.js';
import { asincrono, ErrorApi } from '../utils/errores.js';
import { idValido, lanzarSiHayErrores, rangoFechas, texto, valorPositivo } from '../utils/validaciones.js';

export const adminRouter = Router();
adminRouter.use(requiereAuth, requiereAdmin);

const ESTADOS_SOPORTE = ['pendiente', 'en_proceso', 'resuelta'];

// HU-24 (CA-47): comprobar acceso al panel
adminRouter.get('/acceso', (_req, res) => {
  res.json({ acceso: true });
});

// HU-28 (CA-55, CA-56): indicadores generales con COUNT
adminRouter.get(
  '/dashboard',
  asincrono(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM usuarios)::int AS total_usuarios,
         (SELECT COUNT(*) FROM usuarios WHERE estado = 'activo')::int AS activos,
         (SELECT COUNT(*) FROM usuarios WHERE estado = 'inactivo')::int AS inactivos,
         (SELECT COUNT(*) FROM usuarios WHERE rol = 'administrador')::int AS administradores,
         (SELECT COUNT(*) FROM retos WHERE estado = 'activo')::int AS retos_disponibles,
         (SELECT COUNT(*) FROM retos_usuario WHERE estado = 'activo')::int AS retos_en_curso,
         (SELECT COUNT(*) FROM categorias WHERE estado = 'activo')::int AS categorias_activas,
         (SELECT COUNT(*) FROM solicitudes_soporte WHERE estado <> 'resuelta')::int AS solicitudes_abiertas,
         (SELECT COUNT(DISTINCT id_usuario) FROM actividad_usuarios WHERE fecha >= CURRENT_DATE - 6)::int AS activos_7_dias`,
    );
    res.json(rows[0]);
  }),
);

// HU-25 (CA-49, CA-50): usuarios paginados, con búsqueda por nombre o correo
adminRouter.get(
  '/usuarios',
  asincrono(async (req, res) => {
    const buscar = texto(req.query.buscar);
    const porPagina = Math.min(50, Math.max(1, Number(req.query.porPagina) || 20));
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const filtro = buscar ? `%${buscar.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const where = `WHERE ($1::text IS NULL OR nombre ILIKE $1 OR correo ILIKE $1)`;
    const [{ rows }, total] = await Promise.all([
      pool.query(
        `SELECT id, nombre, correo, fecha_registro, estado, rol FROM usuarios ${where}
         ORDER BY fecha_registro DESC, id DESC LIMIT $2 OFFSET $3`,
        [filtro, porPagina, (pagina - 1) * porPagina],
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM usuarios ${where}`, [filtro]),
    ]);
    const cantidad = total.rows[0].total;
    res.json({ datos: rows, total: cantidad, pagina, paginas: Math.max(1, Math.ceil(cantidad / porPagina)) });
  }),
);

// HU-27 (CA-53, CA-54): datos generales y actividad de una cuenta, sin información financiera
adminRouter.get(
  '/usuarios/:id',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.fecha_registro, u.estado, u.rol, u.ultimo_acceso,
              (SELECT COUNT(*) FROM actividad_usuarios a WHERE a.id_usuario = u.id)::int AS dias_activo,
              (SELECT COUNT(*) FROM actividad_usuarios a WHERE a.id_usuario = u.id AND a.fecha >= CURRENT_DATE - 29)::int AS dias_activo_30,
              (SELECT COUNT(*) FROM retos_usuario r WHERE r.id_usuario = u.id)::int AS retos_iniciados,
              (SELECT COUNT(*) FROM retos_usuario r WHERE r.id_usuario = u.id AND r.estado = 'cumplido')::int AS retos_cumplidos,
              (SELECT COUNT(*) FROM logros_usuario l WHERE l.id_usuario = u.id)::int AS logros,
              (SELECT COUNT(*) FROM solicitudes_soporte s WHERE s.id_usuario = u.id)::int AS solicitudes
       FROM usuarios u WHERE u.id = $1`,
      [id],
    );
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos esa cuenta.');
    res.json(rows[0]);
  }),
);

// HU-26 (CA-51, CA-52): activar o desactivar una cuenta sin borrar sus registros
adminRouter.patch(
  '/usuarios/:id/estado',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const estado = texto(req.body?.estado);
    if (!['activo', 'inactivo'].includes(estado)) throw new ErrorApi(400, 'El estado debe ser activo o inactivo.');
    if (id === idUsuario(req)) throw new ErrorApi(400, 'No puedes desactivar tu propia cuenta.');
    const { rows } = await pool.query(
      'UPDATE usuarios SET estado = $1 WHERE id = $2 RETURNING id, nombre, correo, fecha_registro, estado, rol',
      [estado, id],
    );
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos esa cuenta.');
    res.json(rows[0]);
  }),
);

// HU-32 (CA-63, CA-64): asignar el rol de una cuenta
adminRouter.patch(
  '/usuarios/:id/rol',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const rol = texto(req.body?.rol);
    if (!['usuario', 'administrador'].includes(rol)) throw new ErrorApi(400, 'El rol debe ser usuario o administrador.');
    if (id === idUsuario(req)) throw new ErrorApi(400, 'No puedes cambiar tu propio rol.');
    const { rows } = await pool.query(
      'UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING id, nombre, correo, fecha_registro, estado, rol',
      [rol, id],
    );
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos esa cuenta.');
    res.json(rows[0]);
  }),
);

// ---------- HU-29: categorías de gastos ----------
function leerCategoria(body: unknown) {
  const datos = (body ?? {}) as Record<string, unknown>;
  const nombre = texto(datos.nombre);
  const descripcion = texto(datos.descripcion);
  const errores: Record<string, string> = {};
  if (nombre.length < 3) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
  else if (nombre.length > 60) errores.nombre = 'El nombre no puede superar 60 caracteres.';
  if (descripcion.length > 255) errores.descripcion = 'La descripción no puede superar 255 caracteres.';
  lanzarSiHayErrores(errores);
  return { nombre, descripcion: descripcion || null };
}

/** CA-57: el nombre de categoría es único (sin importar mayúsculas). */
async function validarNombreCategoria(nombre: string, idExcluir: number | null) {
  const { rows } = await pool.query('SELECT 1 FROM categorias WHERE LOWER(nombre) = LOWER($1) AND id <> COALESCE($2, 0)', [
    nombre,
    idExcluir,
  ]);
  if (rows[0]) throw new ErrorApi(409, 'La categoría ya existe.', { nombre: 'Ya existe una categoría con ese nombre.' });
}

function siDuplicado(error: unknown, mensaje: string, campo: string): never {
  if ((error as { code?: string }).code === '23505') throw new ErrorApi(409, mensaje, { [campo]: mensaje });
  throw error;
}

adminRouter.get(
  '/categorias',
  asincrono(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre, c.descripcion, c.estado,
              (SELECT COUNT(*) FROM gastos g WHERE g.id_categoria = c.id)::int AS gastos_asociados
       FROM categorias c ORDER BY c.estado, c.id`,
    );
    res.json(rows);
  }),
);

adminRouter.post(
  '/categorias',
  asincrono(async (req, res) => {
    const categoria = leerCategoria(req.body);
    await validarNombreCategoria(categoria.nombre, null);
    try {
      const { rows } = await pool.query(
        'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING id, nombre, descripcion, estado',
        [categoria.nombre, categoria.descripcion],
      );
      res.status(201).json({ ...rows[0], gastos_asociados: 0 });
    } catch (error) {
      siDuplicado(error, 'La categoría ya existe.', 'nombre');
    }
  }),
);

adminRouter.put(
  '/categorias/:id',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const categoria = leerCategoria(req.body);
    await validarNombreCategoria(categoria.nombre, id);
    try {
      const { rows } = await pool.query(
        'UPDATE categorias SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING id, nombre, descripcion, estado',
        [categoria.nombre, categoria.descripcion, id],
      );
      if (!rows[0]) throw new ErrorApi(404, 'No encontramos esa categoría.');
      res.json(rows[0]);
    } catch (error) {
      siDuplicado(error, 'La categoría ya existe.', 'nombre');
    }
  }),
);

// CA-58: desactivar no borra la categoría; los gastos anteriores la conservan
adminRouter.patch(
  '/categorias/:id/estado',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const estado = texto(req.body?.estado);
    if (!['activo', 'inactivo'].includes(estado)) throw new ErrorApi(400, 'El estado debe ser activo o inactivo.');
    const { rows } = await pool.query('UPDATE categorias SET estado = $1 WHERE id = $2 RETURNING id, nombre, descripcion, estado', [
      estado,
      id,
    ]);
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos esa categoría.');
    res.json(rows[0]);
  }),
);

// ---------- HU-30: retos de ahorro ----------
function leerReto(body: unknown) {
  const datos = (body ?? {}) as Record<string, unknown>;
  const nombre = texto(datos.nombre);
  const descripcion = texto(datos.descripcion);
  const condiciones = texto(datos.condiciones);
  const objetivoTexto = texto(typeof datos.objetivo === 'number' ? String(datos.objetivo) : datos.objetivo);
  const objetivo = valorPositivo(datos.objetivo);
  const duracionTexto = texto(typeof datos.duracion_dias === 'number' ? String(datos.duracion_dias) : datos.duracion_dias);
  const duracion = Number(duracionTexto);

  // CA-60: se indican todos los campos que faltan
  const errores: Record<string, string> = {};
  if (!nombre) errores.nombre = 'El nombre del reto es obligatorio.';
  else if (nombre.length > 100) errores.nombre = 'El nombre no puede superar 100 caracteres.';
  if (!descripcion) errores.descripcion = 'La descripción es obligatoria.';
  else if (descripcion.length > 255) errores.descripcion = 'La descripción no puede superar 255 caracteres.';
  if (!objetivoTexto) errores.objetivo = 'El objetivo es obligatorio.';
  else if (objetivo === null) errores.objetivo = 'El objetivo debe ser un valor mayor que cero.';
  if (!duracionTexto) errores.duracion_dias = 'La duración es obligatoria.';
  else if (!Number.isInteger(duracion) || duracion < 1 || duracion > 365)
    errores.duracion_dias = 'La duración debe ser un número de días entre 1 y 365.';
  if (condiciones.length > 255) errores.condiciones = 'Las condiciones no pueden superar 255 caracteres.';
  const faltantes = [
    !objetivoTexto && 'objetivo',
    !duracionTexto && 'duración',
  ].filter(Boolean);
  lanzarSiHayErrores(errores, faltantes.length ? `Faltan campos obligatorios: ${faltantes.join(' y ')}.` : undefined);
  return { nombre, descripcion, condiciones: condiciones || null, objetivo: objetivo!, duracion };
}

const SELECT_RETO = `
  SELECT r.id, r.nombre, r.descripcion, r.objetivo, r.duracion_dias, r.condiciones, r.estado, r.fecha_creacion,
         (SELECT COUNT(*) FROM retos_usuario ru WHERE ru.id_reto = r.id)::int AS participantes,
         (SELECT COUNT(*) FROM retos_usuario ru WHERE ru.id_reto = r.id AND ru.estado = 'cumplido')::int AS cumplidos
  FROM retos r`;

adminRouter.get(
  '/retos',
  asincrono(async (_req, res) => {
    const { rows } = await pool.query(`${SELECT_RETO} ORDER BY r.estado, r.fecha_creacion DESC`);
    res.json(rows);
  }),
);

adminRouter.post(
  '/retos',
  asincrono(async (req, res) => {
    const reto = leerReto(req.body);
    try {
      const { rows } = await pool.query(
        `INSERT INTO retos (nombre, descripcion, objetivo, duracion_dias, condiciones)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [reto.nombre, reto.descripcion, reto.objetivo, reto.duracion, reto.condiciones],
      );
      const creado = await pool.query(`${SELECT_RETO} WHERE r.id = $1`, [rows[0].id]);
      res.status(201).json(creado.rows[0]);
    } catch (error) {
      siDuplicado(error, 'Ya existe un reto con ese nombre.', 'nombre');
    }
  }),
);

adminRouter.put(
  '/retos/:id',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const reto = leerReto(req.body);
    try {
      const resultado = await pool.query(
        `UPDATE retos SET nombre = $1, descripcion = $2, objetivo = $3, duracion_dias = $4, condiciones = $5 WHERE id = $6`,
        [reto.nombre, reto.descripcion, reto.objetivo, reto.duracion, reto.condiciones, id],
      );
      if (!resultado.rowCount) throw new ErrorApi(404, 'No encontramos ese reto.');
      const { rows } = await pool.query(`${SELECT_RETO} WHERE r.id = $1`, [id]);
      res.json(rows[0]);
    } catch (error) {
      siDuplicado(error, 'Ya existe un reto con ese nombre.', 'nombre');
    }
  }),
);

adminRouter.patch(
  '/retos/:id/estado',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const estado = texto(req.body?.estado);
    if (!['activo', 'inactivo'].includes(estado)) throw new ErrorApi(400, 'El estado debe ser activo o inactivo.');
    const resultado = await pool.query('UPDATE retos SET estado = $1 WHERE id = $2', [estado, id]);
    if (!resultado.rowCount) throw new ErrorApi(404, 'No encontramos ese reto.');
    const { rows } = await pool.query(`${SELECT_RETO} WHERE r.id = $1`, [id]);
    res.json(rows[0]);
  }),
);

// ---------- HU-31: actividad por día (CA-61, CA-62) ----------
adminRouter.get(
  '/actividad',
  asincrono(async (req, res) => {
    const { desde, hasta } = rangoFechas(req.query.desde, req.query.hasta);
    const { rows } = await pool.query(
      `SELECT d::date AS fecha,
              (SELECT COUNT(DISTINCT id_usuario) FROM actividad_usuarios a WHERE a.fecha = d::date)::int AS usuarios_activos,
              (SELECT COUNT(*) FROM usuarios u WHERE u.fecha_registro::date = d::date)::int AS registros,
              (SELECT COUNT(*) FROM retos_usuario r WHERE r.fecha_inicio = d::date)::int AS retos_iniciados,
              (SELECT COUNT(*) FROM retos_usuario r WHERE r.fecha_cumplimiento = d::date)::int AS retos_cumplidos
       FROM generate_series($1::date, $2::date, interval '1 day') AS d
       ORDER BY d`,
      [desde, hasta],
    );
    const { rows: totales } = await pool.query(
      `SELECT
         (SELECT COUNT(DISTINCT id_usuario) FROM actividad_usuarios WHERE fecha BETWEEN $1 AND $2)::int AS usuarios_activos,
         (SELECT COUNT(*) FROM usuarios WHERE fecha_registro::date BETWEEN $1 AND $2)::int AS registros,
         (SELECT COUNT(*) FROM retos_usuario WHERE fecha_inicio BETWEEN $1 AND $2)::int AS retos_iniciados,
         (SELECT COUNT(*) FROM retos_usuario WHERE fecha_cumplimiento BETWEEN $1 AND $2)::int AS retos_cumplidos`,
      [desde, hasta],
    );
    res.json({ desde, hasta, dias: rows, totales: totales[0] });
  }),
);

// ---------- HU-33: reportes de usuarios y participación en retos (CA-65, CA-66) ----------
adminRouter.get(
  '/reportes',
  asincrono(async (req, res) => {
    const { desde, hasta } = rangoFechas(req.query.desde, req.query.hasta);
    const [usuarios, retos] = await Promise.all([
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM usuarios WHERE fecha_registro::date BETWEEN $1 AND $2)::int AS registrados,
           (SELECT COUNT(DISTINCT id_usuario) FROM actividad_usuarios WHERE fecha BETWEEN $1 AND $2)::int AS activos,
           (SELECT COUNT(DISTINCT id_usuario) FROM retos_usuario WHERE fecha_inicio BETWEEN $1 AND $2)::int AS participantes_retos`,
        [desde, hasta],
      ),
      pool.query(
        `SELECT r.id, r.nombre,
                COUNT(ru.id)::int AS iniciados,
                COUNT(ru.id) FILTER (WHERE ru.estado = 'cumplido')::int AS cumplidos,
                COUNT(ru.id) FILTER (WHERE ru.estado = 'no_cumplido')::int AS no_cumplidos,
                COUNT(ru.id) FILTER (WHERE ru.estado = 'activo')::int AS en_curso,
                COUNT(ru.id) FILTER (WHERE ru.estado = 'abandonado')::int AS abandonados
         FROM retos r JOIN retos_usuario ru ON ru.id_reto = r.id AND ru.fecha_inicio BETWEEN $1 AND $2
         GROUP BY r.id, r.nombre
         ORDER BY iniciados DESC, r.nombre`,
        [desde, hasta],
      ),
    ]);
    const resumen = usuarios.rows[0];
    const participacion = retos.rows.map((r) => ({
      ...r,
      tasa_cumplimiento: r.iniciados > 0 ? Math.round((r.cumplidos / r.iniciados) * 1000) / 10 : 0,
    }));
    res.json({
      desde,
      hasta,
      ...resumen,
      participacion,
      sinDatos: resumen.registrados === 0 && resumen.activos === 0 && participacion.length === 0,
    });
  }),
);

// ---------- HU-34: solicitudes de soporte (CA-67, CA-68) ----------
adminRouter.get(
  '/soporte',
  asincrono(async (req, res) => {
    const estado = texto(req.query.estado);
    if (estado && !ESTADOS_SOPORTE.includes(estado)) throw new ErrorApi(400, 'Estado no válido.');
    const { rows } = await pool.query(
      `SELECT s.id, s.asunto, s.estado, s.fecha, s.fecha_actualizacion, u.nombre AS usuario, u.correo
       FROM solicitudes_soporte s JOIN usuarios u ON u.id = s.id_usuario
       WHERE ($1::text = '' OR s.estado = $1)
       ORDER BY CASE s.estado WHEN 'pendiente' THEN 0 WHEN 'en_proceso' THEN 1 ELSE 2 END, s.fecha DESC`,
      [estado],
    );
    res.json(rows);
  }),
);

adminRouter.get(
  '/soporte/:id',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const { rows } = await pool.query(
      `SELECT s.id, s.asunto, s.descripcion, s.estado, s.anotacion, s.fecha, s.fecha_actualizacion,
              u.nombre AS usuario, u.correo, a.nombre AS responsable
       FROM solicitudes_soporte s
       JOIN usuarios u ON u.id = s.id_usuario
       LEFT JOIN usuarios a ON a.id = s.id_admin
       WHERE s.id = $1`,
      [id],
    );
    if (!rows[0]) throw new ErrorApi(404, 'No encontramos esa solicitud.');
    const { rows: seguimiento } = await pool.query(
      `SELECT sg.id, sg.estado, sg.anotacion, sg.fecha, a.nombre AS responsable
       FROM soporte_seguimiento sg LEFT JOIN usuarios a ON a.id = sg.id_admin
       WHERE sg.id_solicitud = $1 ORDER BY sg.fecha DESC, sg.id DESC`,
      [id],
    );
    res.json({ ...rows[0], seguimiento });
  }),
);

// CA-68: cambiar el estado y guardar la anotación con la fecha y el administrador responsable
adminRouter.patch(
  '/soporte/:id',
  asincrono(async (req, res) => {
    const id = idValido(req.params.id);
    const estado = texto(req.body?.estado);
    const anotacion = texto(req.body?.anotacion);
    const errores: Record<string, string> = {};
    if (!ESTADOS_SOPORTE.includes(estado)) errores.estado = 'Elige un estado.';
    if (!anotacion) errores.anotacion = 'Escribe una anotación sobre el seguimiento.';
    else if (anotacion.length > 1000) errores.anotacion = 'La anotación no puede superar 1000 caracteres.';
    lanzarSiHayErrores(errores);
    const admin = idUsuario(req);
    await enTransaccion(async (cliente) => {
      const resultado = await cliente.query(
        `UPDATE solicitudes_soporte SET estado = $1, anotacion = $2, id_admin = $3, fecha_actualizacion = NOW()
         WHERE id = $4`,
        [estado, anotacion, admin, id],
      );
      if (!resultado.rowCount) throw new ErrorApi(404, 'No encontramos esa solicitud.');
      await cliente.query(
        'INSERT INTO soporte_seguimiento (id_solicitud, id_admin, estado, anotacion) VALUES ($1, $2, $3, $4)',
        [id, admin, estado, anotacion],
      );
    });
    res.json({ ok: true });
  }),
);
