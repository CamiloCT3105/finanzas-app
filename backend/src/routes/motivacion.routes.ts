import { Router } from 'express';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { listarLogros } from '../services/logros.js';
import { calcularRacha } from '../services/racha.js';
import { asincrono } from '../utils/errores.js';

export const motivacionRouter = Router();
motivacionRouter.use(requiereAuth);

// HU-22 (CA-43, CA-44): racha de días seguidos con ahorro
motivacionRouter.get(
  '/racha',
  asincrono(async (req, res) => {
    res.json(await calcularRacha(idUsuario(req)));
  }),
);

// HU-23: logros obtenidos y por obtener
motivacionRouter.get(
  '/logros',
  asincrono(async (req, res) => {
    res.json(await listarLogros(idUsuario(req)));
  }),
);
