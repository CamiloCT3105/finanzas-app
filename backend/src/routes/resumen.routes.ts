import { Router } from 'express';
import { pool } from '../config/db.js';
import { idUsuario, requiereAuth } from '../middleware/auth.js';
import { calcularCapacidad, totalesMes } from '../services/finanzas.js';
import { calcularRacha } from '../services/racha.js';
import { asincrono } from '../utils/errores.js';
import { rangoMes } from '../utils/validaciones.js';

export const resumenRouter = Router();
resumenRouter.use(requiereAuth);

function mesAnterior(mes: string): string {
  const [anio, numero] = mes.split('-').map(Number) as [number, number];
  return numero === 1 ? `${anio - 1}-12` : `${anio}-${String(numero - 1).padStart(2, '0')}`;
}

/** HU-13 (CA-25): gastos del período agrupados por categoría con su porcentaje. */
async function gastosPorCategoria(id: number, inicio: string, fin: string) {
  const { rows } = await pool.query(
    `SELECT c.id, c.nombre AS categoria, SUM(g.valor) AS total, COUNT(*)::int AS cantidad
     FROM gastos g JOIN categorias c ON c.id = g.id_categoria
     WHERE g.id_usuario = $1 AND g.fecha >= $2 AND g.fecha < $3
     GROUP BY c.id, c.nombre
     ORDER BY total DESC`,
    [id, inicio, fin],
  );
  const total = rows.reduce((acc, r) => acc + r.total, 0);
  return rows.map((r) => ({ ...r, porcentaje: total > 0 ? Math.round((r.total / total) * 1000) / 10 : 0 }));
}

/** Avance de las metas: ahorro total, porcentaje y lo aportado en el mes. */
async function avanceMetas(id: number, inicio: string, fin: string) {
  const { rows } = await pool.query(
    `SELECT m.id, m.nombre, m.valor_objetivo, m.valor_ahorrado, m.estado,
            COALESCE((SELECT SUM(a.valor) FROM aportes a
                      WHERE a.id_meta = m.id AND a.fecha >= $2 AND a.fecha < $3), 0) AS aportado_mes
     FROM metas m
     WHERE m.id_usuario = $1 AND m.estado <> 'cancelada'
     ORDER BY (m.estado = 'cumplida'), m.fecha_creacion DESC`,
    [id, inicio, fin],
  );
  return rows.map((m) => ({
    ...m,
    porcentaje: Math.min(100, Math.floor((m.valor_ahorrado / m.valor_objetivo) * 100)),
    restante: Math.max(0, m.valor_objetivo - m.valor_ahorrado),
  }));
}

// HU-09 (CA-17, CA-18): dinero disponible del mes = SUM(ingresos) - SUM(gastos)
resumenRouter.get(
  '/disponible',
  asincrono(async (req, res) => {
    const { mes, inicio, fin } = rangoMes(req.query.mes);
    const t = await totalesMes(idUsuario(req), inicio, fin);
    const disponible = t.ingresos - t.gastos;
    res.json({
      mes,
      ingresos: t.ingresos,
      gastos: t.gastos,
      gastosFijos: t.gastosFijos,
      gastosVariables: t.gastosVariables,
      disponible,
      movimientos: t.movimientos,
      sobregirado: disponible < 0,
    });
  }),
);

// HU-10 (CA-19, CA-20): porcentaje del ingreso que se puede ahorrar
resumenRouter.get(
  '/capacidad',
  asincrono(async (req, res) => {
    const { mes, inicio, fin } = rangoMes(req.query.mes);
    const t = await totalesMes(idUsuario(req), inicio, fin);
    res.json({ mes, ...calcularCapacidad(t.ingresos, t.gastos) });
  }),
);

// HU-11 (CA-21, CA-22): resumen de la pantalla principal
resumenRouter.get(
  '/dashboard',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    const { mes, inicio, fin } = rangoMes(req.query.mes);
    const [t, metas, racha] = await Promise.all([totalesMes(id, inicio, fin), avanceMetas(id, inicio, fin), calcularRacha(id)]);
    const capacidad = calcularCapacidad(t.ingresos, t.gastos);
    const disponible = t.ingresos - t.gastos;
    res.json({
      mes,
      ingresos: t.ingresos,
      gastos: t.gastos,
      gastosFijos: t.gastosFijos,
      gastosVariables: t.gastosVariables,
      disponible,
      sobregirado: disponible < 0,
      ahorro: t.ahorro,
      capacidad,
      racha: racha.actual,
      metas: metas.slice(0, 3),
      totalMetas: metas.length,
      movimientos: t.movimientos,
      // CA-22: sin ingresos, gastos ni metas la app muestra la guía para empezar.
      vacio: t.movimientos === 0 && metas.length === 0,
    });
  }),
);

// HU-12 (CA-23, CA-24) y HU-13 (CA-25, CA-26): resumen de un mes con gastos por categoría
resumenRouter.get(
  '/mensual',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    const { mes, inicio, fin } = rangoMes(req.query.mes);
    const [t, categorias, metas] = await Promise.all([
      totalesMes(id, inicio, fin),
      gastosPorCategoria(id, inicio, fin),
      avanceMetas(id, inicio, fin),
    ]);
    const metasDelMes = metas.filter((m) => m.aportado_mes > 0);
    res.json({
      mes,
      ingresos: t.ingresos,
      gastos: t.gastos,
      gastosFijos: t.gastosFijos,
      gastosVariables: t.gastosVariables,
      disponible: t.ingresos - t.gastos,
      ahorro: t.ahorro,
      capacidad: calcularCapacidad(t.ingresos, t.gastos),
      categorias,
      metas: metasDelMes,
      sinDatos: t.movimientos === 0 && t.ahorro === 0,
    });
  }),
);

// HU-14 (CA-27, CA-28): gastos del mes comparados con el mes anterior
resumenRouter.get(
  '/comparacion',
  asincrono(async (req, res) => {
    const id = idUsuario(req);
    const actual = rangoMes(req.query.mes);
    const anterior = rangoMes(mesAnterior(actual.mes));
    const { rows } = await pool.query(
      `SELECT
         (SELECT COALESCE(SUM(valor), 0) FROM gastos WHERE id_usuario = $1 AND fecha >= $2 AND fecha < $3) AS actual,
         (SELECT COALESCE(SUM(valor), 0) FROM gastos WHERE id_usuario = $1 AND fecha >= $4 AND fecha < $5) AS anterior,
         (SELECT COUNT(*) FROM gastos WHERE id_usuario = $1 AND fecha >= $4 AND fecha < $5)::int AS gastos_anterior`,
      [id, actual.inicio, actual.fin, anterior.inicio, anterior.fin],
    );
    const fila = rows[0];
    const base = { mes: actual.mes, mesAnterior: anterior.mes, gastosActual: fila.actual, gastosAnterior: fila.anterior };
    if (fila.gastos_anterior === 0) {
      res.json({ ...base, sinAnterior: true, mensaje: 'No hay gastos del mes anterior para comparar.' });
      return;
    }
    const diferencia = fila.actual - fila.anterior;
    const porcentaje = Math.round((diferencia / fila.anterior) * 1000) / 10;
    res.json({
      ...base,
      sinAnterior: false,
      diferencia,
      porcentaje,
      tendencia: diferencia > 0 ? 'aumento' : diferencia < 0 ? 'disminucion' : 'igual',
    });
  }),
);
