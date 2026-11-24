import cors from 'cors';
import express from 'express';
import { pool } from './config/db.js';
import { env } from './config/env.js';
import { adminRouter } from './routes/admin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { categoriasRouter } from './routes/categorias.routes.js';
import { gastosRouter } from './routes/gastos.routes.js';
import { ingresosRouter } from './routes/ingresos.routes.js';
import { metasRouter } from './routes/metas.routes.js';
import { motivacionRouter } from './routes/motivacion.routes.js';
import { resumenRouter } from './routes/resumen.routes.js';
import { retosRouter } from './routes/retos.routes.js';
import { soporteRouter } from './routes/soporte.routes.js';
import { usuariosRouter } from './routes/usuarios.routes.js';
import { manejadorErrores } from './utils/errores.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/salud', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ estado: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/ingresos', ingresosRouter);
app.use('/api/gastos', gastosRouter);
app.use('/api/resumen', resumenRouter);
app.use('/api/metas', metasRouter);
app.use('/api/retos', retosRouter);
app.use('/api/motivacion', motivacionRouter);
app.use('/api/soporte', soporteRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});
app.use(manejadorErrores);

// 0.0.0.0 para que un celular en la misma red Wi-Fi pueda conectarse.
app.listen(env.puerto, '0.0.0.0', () => {
  console.log(`API de Finanzas App escuchando en http://localhost:${env.puerto}/api`);
});
