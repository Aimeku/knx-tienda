-- ============================================================
-- Migración: perfiles de usuario con aprobación manual
-- Ejecutar en el SQL Editor de Supabase
--
-- Cada fila está vinculada 1:1 a un usuario de Supabase Auth (auth.users).
-- estado empieza en 'pendiente' al registrarse; solo el backend (service
-- role, usado desde /api/admin/perfil) puede cambiarlo a 'aprobado' o
-- 'rechazado'. Mientras no esté 'aprobado', el login lo bloquea la propia
-- aplicación (comprueba este campo justo después de iniciar sesión).
-- ============================================================

create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  apellidos text not null,
  empresa text not null,
  cif_nif text not null,
  tipo_profesional text not null,
  direccion text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table perfiles enable row level security;

-- Cada usuario puede leer su propio perfil (para comprobar su estado al iniciar sesión).
create policy "Los usuarios ven su propio perfil"
  on perfiles for select
  using (auth.uid() = id);

-- No hay policy de insert/update para usuarios normales a propósito: el alta
-- (con estado pendiente) y los cambios de estado los hace únicamente el
-- backend con la service role key, que no está sujeta a RLS.
