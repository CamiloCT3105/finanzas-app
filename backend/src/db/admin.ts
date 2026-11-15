// Da el rol de administrador a una cuenta ya registrada (para crear el primer administrador).
// Uso: npm run db:admin -- correo@ejemplo.com
import pg from 'pg';
import { env } from '../config/env.js';

async function main() {
  const correo = (process.argv[2] ?? '').trim().toLowerCase();
  if (!correo) {
    console.error('Indica el correo de la cuenta: npm run db:admin -- correo@ejemplo.com');
    process.exit(1);
  }
  const cliente = new pg.Client(env.db);
  await cliente.connect();
  const { rows } = await cliente.query(
    "UPDATE usuarios SET rol = 'administrador' WHERE correo = $1 RETURNING nombre, correo",
    [correo],
  );
  await cliente.end();
  if (!rows[0]) {
    console.error(`No existe una cuenta con el correo ${correo}. Regístrala primero en la app.`);
    process.exit(1);
  }
  console.log(`${rows[0].nombre} (${rows[0].correo}) ahora es administrador.`);
}

main().catch((error) => {
  console.error('No se pudo asignar el rol:', error.message);
  process.exit(1);
});
