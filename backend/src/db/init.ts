// Crea la base de datos (si no existe) y aplica schema.sql.
// Uso: npm run db:init
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { env } from '../config/env.js';

async function main() {
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

  const cliente = new pg.Client(env.db);
  await cliente.connect();
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await cliente.query(sql);
  await cliente.end();
  console.log('Tablas listas: usuarios, categorias, ingresos, gastos, metas.');
}

main().catch((error) => {
  console.error('No se pudo inicializar la base de datos:', error.message);
  process.exit(1);
});
