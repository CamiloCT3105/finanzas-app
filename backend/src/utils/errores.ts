import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class ErrorApi extends Error {
  constructor(
    public estado: number,
    mensaje: string,
    public campos?: Record<string, string>,
  ) {
    super(mensaje);
  }
}

// Envuelve controladores async para que los errores lleguen al manejador global.
export const asincrono =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function manejadorErrores(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ErrorApi) {
    res.status(error.estado).json({ mensaje: error.message, ...(error.campos ? { campos: error.campos } : {}) });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido.' });
    return;
  }
  // Red de seguridad para datos que la validación no atrapó: se responde 400/409 en vez de 500.
  const codigo = (error as { code?: string }).code;
  if (codigo === '22003') {
    res.status(400).json({ mensaje: 'El valor es demasiado grande.' });
    return;
  }
  if (codigo === '22P02' || codigo === '22007' || codigo === '22008') {
    res.status(400).json({ mensaje: 'Alguno de los datos enviados no tiene un formato válido.' });
    return;
  }
  if (codigo === '23505') {
    res.status(409).json({ mensaje: 'Ese registro ya existe.' });
    return;
  }
  console.error(error);
  res.status(500).json({ mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.' });
}
