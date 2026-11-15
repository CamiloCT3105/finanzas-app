-- Esquema de la base de datos de Finanzas App (Sprint 1)
-- Se puede ejecutar varias veces: solo crea lo que no existe.

-- HU-01 / HU-02 / HU-03: cuenta de usuario
CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  correo          VARCHAR(150) NOT NULL UNIQUE,
  contrasena      VARCHAR(255) NOT NULL,          -- hash bcrypt
  rol             VARCHAR(20)  NOT NULL DEFAULT 'usuario'
                    CHECK (rol IN ('usuario', 'administrador')),
  estado          VARCHAR(20)  NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'inactivo')),
  fecha_registro  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- HU-07: categorías de gastos
CREATE TABLE IF NOT EXISTS categorias (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(60)  NOT NULL UNIQUE,
  descripcion  VARCHAR(255),
  estado       VARCHAR(20)  NOT NULL DEFAULT 'activo'
                 CHECK (estado IN ('activo', 'inactivo'))
);

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Vivienda',        'Arriendo, administración, hipoteca'),
  ('Alimentación',    'Mercado, restaurantes, domicilios'),
  ('Transporte',      'Pasajes, gasolina, parqueadero'),
  ('Servicios',       'Agua, luz, gas, internet, celular'),
  ('Entretenimiento', 'Salidas, streaming, hobbies'),
  ('Salud',           'Medicamentos, citas, seguros'),
  ('Educación',       'Matrículas, cursos, libros'),
  ('Otros',           'Gastos que no encajan en otra categoría')
ON CONFLICT (nombre) DO NOTHING;

-- HU-04: ingresos
CREATE TABLE IF NOT EXISTS ingresos (
  id           SERIAL PRIMARY KEY,
  id_usuario   INTEGER       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  valor        NUMERIC(14,2) NOT NULL CHECK (valor > 0),
  tipo         VARCHAR(30)   NOT NULL
                 CHECK (tipo IN ('salario', 'independiente', 'negocio', 'pension', 'otro')),
  descripcion  VARCHAR(150),
  fecha        DATE          NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_ingresos_usuario_fecha ON ingresos (id_usuario, fecha);

-- HU-05 / HU-06 / HU-07: gastos fijos y variables
CREATE TABLE IF NOT EXISTS gastos (
  id            SERIAL PRIMARY KEY,
  id_usuario    INTEGER       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  id_categoria  INTEGER       NOT NULL REFERENCES categorias(id),
  valor         NUMERIC(14,2) NOT NULL CHECK (valor > 0),
  tipo          VARCHAR(10)   NOT NULL CHECK (tipo IN ('fijo', 'variable')),
  descripcion   VARCHAR(150),
  fecha         DATE          NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_gastos_usuario_fecha ON gastos (id_usuario, fecha);

-- HU-15: metas de ahorro
CREATE TABLE IF NOT EXISTS metas (
  id               SERIAL PRIMARY KEY,
  id_usuario       INTEGER       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre           VARCHAR(100)  NOT NULL,
  valor_objetivo   NUMERIC(14,2) NOT NULL CHECK (valor_objetivo > 0),
  valor_ahorrado   NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (valor_ahorrado >= 0),
  fecha_limite     DATE,
  descripcion      VARCHAR(255),
  estado           VARCHAR(20)   NOT NULL DEFAULT 'activa'
                     CHECK (estado IN ('activa', 'cumplida', 'cancelada')),
  fecha_creacion   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metas_usuario ON metas (id_usuario);

-- =====================================================================
-- Sprint 2
-- =====================================================================

-- HU-31: días en que cada usuario usó la aplicación (solo conteos, sin datos financieros)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS actividad_usuarios (
  id_usuario  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha       DATE    NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (id_usuario, fecha)
);

CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividad_usuarios (fecha);

-- HU-19 / HU-30: catálogo de retos de ahorro
CREATE TABLE IF NOT EXISTS retos (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100)  NOT NULL UNIQUE,
  descripcion     VARCHAR(255)  NOT NULL,
  objetivo        NUMERIC(14,2) NOT NULL CHECK (objetivo > 0),
  duracion_dias   INTEGER       NOT NULL CHECK (duracion_dias BETWEEN 1 AND 365),
  condiciones     VARCHAR(255),
  estado          VARCHAR(20)   NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'inactivo')),
  fecha_creacion  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

INSERT INTO retos (nombre, descripcion, objetivo, duracion_dias, condiciones) VALUES
  ('Ahorrar $20.000 durante una semana', 'Separa pequeñas cantidades cada día hasta juntar $20.000 en 7 días.', 20000, 7,
   'Registra al menos $20.000 en avances antes de que termine la semana.'),
  ('Semana sin domicilios', 'Cocina en casa y ahorra lo que gastarías en domicilios.', 50000, 7,
   'Registra como avance cada domicilio que decidiste no pedir hasta sumar $50.000.'),
  ('Fin de semana sin gastos hormiga', 'Evita cafés, snacks y compras pequeñas durante el fin de semana.', 30000, 3,
   'Suma $30.000 en avances en 3 días.'),
  ('Reto de los $100.000 en un mes', 'Construye el hábito de ahorrar un poco cada semana.', 100000, 30,
   'Registra avances hasta completar $100.000 en 30 días.')
ON CONFLICT (nombre) DO NOTHING;

-- HU-19 / HU-21: retos que inicia cada usuario
CREATE TABLE IF NOT EXISTS retos_usuario (
  id                  SERIAL PRIMARY KEY,
  id_usuario          INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  id_reto             INTEGER     NOT NULL REFERENCES retos(id),
  fecha_inicio        DATE        NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin           DATE        NOT NULL,
  estado              VARCHAR(20) NOT NULL DEFAULT 'activo'
                        CHECK (estado IN ('activo', 'cumplido', 'no_cumplido', 'abandonado')),
  fecha_cumplimiento  DATE,
  fecha_registro      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CA-38: un usuario solo puede tener un reto activo a la vez
CREATE UNIQUE INDEX IF NOT EXISTS uq_reto_activo_usuario ON retos_usuario (id_usuario) WHERE estado = 'activo';
CREATE INDEX IF NOT EXISTS idx_retos_usuario_inicio ON retos_usuario (fecha_inicio);

-- HU-17 / HU-20 / HU-21: dinero que se suma a una meta
CREATE TABLE IF NOT EXISTS aportes (
  id                SERIAL PRIMARY KEY,
  id_meta           INTEGER       NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  id_reto_usuario   INTEGER       REFERENCES retos_usuario(id) ON DELETE SET NULL,
  valor             NUMERIC(14,2) NOT NULL CHECK (valor > 0),
  tipo              VARCHAR(20)   NOT NULL CHECK (tipo IN ('ahorro', 'gasto_evitado', 'reto')),
  descripcion       VARCHAR(150),
  fecha             DATE          NOT NULL DEFAULT CURRENT_DATE,
  fecha_registro    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aportes_meta_fecha ON aportes (id_meta, fecha);

-- HU-23: logros
CREATE TABLE IF NOT EXISTS logros (
  id           SERIAL PRIMARY KEY,
  codigo       VARCHAR(40)  NOT NULL UNIQUE,
  nombre       VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(255) NOT NULL,
  condicion    VARCHAR(255) NOT NULL,
  icono        VARCHAR(40)  NOT NULL DEFAULT 'trophy'
);

INSERT INTO logros (codigo, nombre, descripcion, condicion, icono) VALUES
  ('primer_ingreso', 'Primer ingreso', 'Registraste tu primer ingreso.', 'Registrar un ingreso', 'wallet'),
  ('primera_meta', 'Primera meta creada', 'Le pusiste nombre a lo que quieres lograr.', 'Crear una meta de ahorro', 'flag'),
  ('primer_ahorro', 'Primer ahorro', 'Hiciste tu primer aporte a una meta.', 'Registrar un ahorro o un gasto evitado', 'cash'),
  ('meta_cumplida', 'Meta cumplida', 'Alcanzaste el valor objetivo de una meta.', 'Completar una meta', 'trophy'),
  ('reto_cumplido', 'Reto superado', 'Cumpliste un reto de ahorro dentro del plazo.', 'Completar un reto', 'medal'),
  ('racha_7', 'Una semana ahorrando', 'Ahorraste 7 días seguidos.', 'Llegar a una racha de 7 días', 'flame'),
  ('ahorro_100k', 'Ahorrador constante', 'Has ahorrado $100.000 o más en total.', 'Sumar $100.000 en aportes', 'ribbon')
ON CONFLICT (codigo) DO NOTHING;

-- CA-46: cada logro se otorga una sola vez por usuario
CREATE TABLE IF NOT EXISTS logros_usuario (
  id_usuario  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  id_logro    INTEGER     NOT NULL REFERENCES logros(id),
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_usuario, id_logro)
);

-- HU-34: solicitudes de soporte y su seguimiento
CREATE TABLE IF NOT EXISTS solicitudes_soporte (
  id                   SERIAL PRIMARY KEY,
  id_usuario           INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  asunto               VARCHAR(120) NOT NULL,
  descripcion          VARCHAR(1000) NOT NULL,
  estado               VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                         CHECK (estado IN ('pendiente', 'en_proceso', 'resuelta')),
  anotacion            VARCHAR(1000),
  id_admin             INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  fecha_actualizacion  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS soporte_seguimiento (
  id            SERIAL PRIMARY KEY,
  id_solicitud  INTEGER      NOT NULL REFERENCES solicitudes_soporte(id) ON DELETE CASCADE,
  id_admin      INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
  estado        VARCHAR(20)  NOT NULL,
  anotacion     VARCHAR(1000),
  fecha         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
