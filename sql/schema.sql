-- ============================================================
-- Esquema de base de datos para la tienda KNX
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Categorías (actuadores, sensores, pantallas táctiles, etc.)
create table categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  descripcion text,
  orden int default 0,
  created_at timestamptz default now()
);

-- Productos
create table productos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id) on delete set null,
  sku text not null unique,
  nombre text not null,
  slug text not null unique,
  descripcion_corta text,
  descripcion_larga text,
  marca text,
  precio numeric(10,2) not null,
  precio_oferta numeric(10,2),
  stock int not null default 0,
  activo boolean not null default true,
  datasheet_url text,          -- PDF de ficha técnica, típico en KNX
  imagen_principal text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_productos_categoria on productos(categoria_id);
create index idx_productos_activo on productos(activo);

-- Imágenes adicionales por producto (varias fotos)
create table producto_imagenes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  url text not null,
  orden int default 0
);

-- Variantes (acabado, nº de canales, color...)
create table producto_variantes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  nombre text not null,        -- ej: "Blanco mate", "4 canales"
  sku_variante text unique,
  precio_extra numeric(10,2) default 0,
  stock int not null default 0
);

-- Pedidos
create table pedidos (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  cliente_email text not null,
  cliente_nombre text,
  direccion_envio jsonb,
  estado text not null default 'pendiente', -- pendiente | pagado | enviado | cancelado
  total numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Líneas de pedido
create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id),
  variante_id uuid references producto_variantes(id),
  nombre_producto text not null,   -- copia del nombre en el momento de la compra
  cantidad int not null,
  precio_unitario numeric(10,2) not null
);

-- ============================================================
-- Row Level Security: lectura pública de catálogo,
-- escritura solo desde el backend (service role)
-- ============================================================
alter table categorias enable row level security;
alter table productos enable row level security;
alter table producto_imagenes enable row level security;
alter table producto_variantes enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;

create policy "Categorías visibles para todos"
  on categorias for select using (true);

create policy "Productos activos visibles para todos"
  on productos for select using (activo = true);

create policy "Imágenes visibles para todos"
  on producto_imagenes for select using (true);

create policy "Variantes visibles para todos"
  on producto_variantes for select using (true);

-- pedidos y pedido_items: sin policy de select pública.
-- Solo el backend (con la service role key) puede leer/escribir pedidos.
