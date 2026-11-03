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
