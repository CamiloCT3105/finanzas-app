import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ErrorApi } from '../utils/errores.js';

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

/** Exige un token JWT válido (CA-06: sin token el backend rechaza la petición). */
export function requiereAuth(req: Request, _res: Response, next: NextFunction) {
  const cabecera = req.headers.authorization ?? '';
  const [esquema, token] = cabecera.split(' ');
  if (esquema !== 'Bearer' || !token) {
    next(new ErrorApi(401, 'Debes iniciar sesión para continuar.'));
    return;
  }
  try {
    const datos = jwt.verify(token, env.jwt.secreto) as jwt.JwtPayload;
    req.usuario = { id: Number(datos.sub), rol: datos.rol };
    next();
  } catch {
    next(new ErrorApi(401, 'Tu sesión expiró. Inicia sesión de nuevo.'));
  }
}

/** Id del usuario autenticado; solo se usa en rutas protegidas por requiereAuth. */
export function idUsuario(req: Request): number {
  if (!req.usuario) throw new ErrorApi(401, 'Debes iniciar sesión para continuar.');
  return req.usuario.id;
}
