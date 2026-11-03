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
  console.error(error);
  res.status(500).json({ mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.' });
}
