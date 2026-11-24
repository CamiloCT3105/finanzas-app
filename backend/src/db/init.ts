// Crea la base de datos (si no existe) y aplica schema.sql.
// Uso local:  npm run db:init
// En la nube: con DATABASE_URL la base ya existe (la crea el proveedor), así que solo se aplica el esquema.
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { env } from '../config/env.js';

async function crearBaseSiNoExiste() {
  const admin = new pg.Client({ ...env.db, database: 'postgres' });
  await admin.connect();
  const existe = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.db.database]);
  if (existe.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${env.db.database.replace(/"/g, '""')}"`);
    console.log(`Base de datos "${env.db.database}" creada.`);
  } else {
    console.log(`La base de datos "${env.db.database}" ya existe.`);
  }
  await admin.end();
}

async function main() {
  if (!env.usaDatabaseUrl) await crearBaseSiNoExiste();

  const cliente = new pg.Client(env.db);
  await cliente.connect();
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await cliente.query(sql);

  // Zona horaria por defecto de la base, para que CURRENT_DATE sea la fecha de Colombia
  // incluso con poolers que no conservan el SET TIME ZONE de cada sesión.
  try {
    await cliente.query(
      `DO $$ BEGIN EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), '${env.zonaHoraria}'); END $$;`,
    );
    console.log(`Zona horaria de la base: ${env.zonaHoraria}.`);
  } catch (error) {
    console.warn('Aviso: no se pudo fijar la zona horaria de la base:', (error as Error).message);
  }
  await cliente.end();
  console.log(
    'Tablas listas: usuarios, categorias, ingresos, gastos, metas, aportes, retos, retos_usuario, logros, ' +
      'logros_usuario, actividad_usuarios, solicitudes_soporte y soporte_seguimiento.',
  );
}

main().catch((error) => {
  console.error('No se pudo inicializar la base de datos:', error.message);
  process.exit(1);
});
