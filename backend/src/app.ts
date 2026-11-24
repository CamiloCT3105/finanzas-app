import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
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

// En Render/Railway la API está detrás de un proxy: así req.ip es la IP real del cliente
// (la usa el límite de peticiones).
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
// CORS_ORIGIN permite limitar qué páginas web pueden llamar la API (separadas por coma).
// La app del celular no usa CORS, así que sin la variable se permite cualquier origen.
const origenes = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(origenes?.length ? { origin: origenes } : {}));
app.use(express.json({ limit: '100kb' }));

const mensajeLimite = (mensaje: string) => ({
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  handler: (_req: express.Request, res: express.Response) => {
    res.status(429).json({ mensaje });
  },
});

// Evita adivinar contraseñas por fuerza bruta: 10 intentos fallidos de login cada 15 minutos por IP.
const limiteLogin = rateLimit({
  ...mensajeLimite('Demasiados intentos de inicio de sesión. Espera 15 minutos e intenta de nuevo.'),
  limit: 10,
  skipSuccessfulRequests: true,
});
// Evita la creación masiva de cuentas.
const limiteRegistro = rateLimit({
  ...mensajeLimite('Demasiados registros desde esta conexión. Intenta más tarde.'),
  limit: 20,
});
// Límite general generoso para toda la API.
const limiteGeneral = rateLimit({
  ...mensajeLimite('Demasiadas peticiones. Espera un momento e intenta de nuevo.'),
  limit: 1000,
});

app.get('/api/salud', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok' });
  } catch {
    res.status(503).json({ estado: 'sin_base_de_datos' });
  }
});

app.use('/api', limiteGeneral);
app.use('/api/auth/login', limiteLogin);
app.use('/api/auth/registro', limiteRegistro);
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

// 0.0.0.0 para que un celular en la misma red Wi-Fi (o el proxy de la nube) pueda conectarse.
const servidor = app.listen(env.puerto, '0.0.0.0', () => {
  console.log(`API de Finanzas App escuchando en el puerto ${env.puerto} (zona horaria ${env.zonaHoraria})`);
});

// Render/Railway envían SIGTERM al redesplegar: se cierran las conexiones con orden.
function apagar() {
  servidor.close(() => {
    pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 10_000).unref();
}
process.on('SIGTERM', apagar);
process.on('SIGINT', apagar);
