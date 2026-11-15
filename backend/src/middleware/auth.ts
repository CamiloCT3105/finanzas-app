import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { ErrorApi } from '../utils/errores.js';
import { hoy } from '../utils/validaciones.js';

export interface UsuarioToken {
  id: number;
  rol: 'usuario' | 'administrador';
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

export function firmarToken(usuario: UsuarioToken) {
  return jwt.sign({ rol: usuario.rol }, env.jwt.secreto, {
    subject: String(usuario.id),
    expiresIn: env.jwt.expiraEn as jwt.SignOptions['expiresIn'] & string,
  });
}

// Evita escribir la actividad del día en cada petición: basta una vez por usuario y día.
const actividadRegistrada = new Set<string>();

async function registrarActividad(idUsuario: number) {
  const clave = `${idUsuario}:${hoy()}`;
  if (actividadRegistrada.has(clave)) return;
  if (actividadRegistrada.size > 10_000) actividadRegistrada.clear();
  actividadRegistrada.add(clave);
  await pool.query(
    `WITH dia AS (
       INSERT INTO actividad_usuarios (id_usuario, fecha) VALUES ($1, CURRENT_DATE) ON CONFLICT DO NOTHING
     )
     UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1`,
    [idUsuario],
  );
}

/**
 * Exige un token JWT válido (CA-06). El rol y el estado se leen de la base de datos para que
 * desactivar una cuenta (CA-51) o cambiarle el rol (CA-63) tenga efecto de inmediato.
 */
export async function requiereAuth(req: Request, _res: Response, next: NextFunction) {
  const cabecera = req.headers.authorization ?? '';
  const [esquema, token] = cabecera.split(' ');
  if (esquema !== 'Bearer' || !token) {
    next(new ErrorApi(401, 'Debes iniciar sesión para continuar.'));
    return;
  }
  let id: number;
  try {
    const datos = jwt.verify(token, env.jwt.secreto) as jwt.JwtPayload;
    id = Number(datos.sub);
  } catch {
    next(new ErrorApi(401, 'Tu sesión expiró. Inicia sesión de nuevo.'));
    return;
  }
  try {
    const { rows } = await pool.query('SELECT rol, estado FROM usuarios WHERE id = $1', [id]);
    const cuenta = rows[0];
    if (!cuenta) throw new ErrorApi(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
    if (cuenta.estado !== 'activo') throw new ErrorApi(401, 'Tu cuenta está desactivada. Comunícate con soporte.');
    req.usuario = { id, rol: cuenta.rol };
    await registrarActividad(id);
    next();
  } catch (error) {
    next(error);
  }
}

/** Solo deja pasar a los administradores (CA-47, CA-48). Va después de requiereAuth. */
export function requiereAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.usuario?.rol !== 'administrador') {
    next(new ErrorApi(403, 'Acceso denegado: esta sección es solo para administradores.'));
    return;
  }
  next();
}

/** Id del usuario autenticado; solo se usa en rutas protegidas por requiereAuth. */
export function idUsuario(req: Request): number {
  if (!req.usuario) throw new ErrorApi(401, 'Debes iniciar sesión para continuar.');
  return req.usuario.id;
}
