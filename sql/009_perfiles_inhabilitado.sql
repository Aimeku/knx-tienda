-- ============================================================
-- Migración: estado 'inhabilitado' para las cuentas
-- Ejecutar en el SQL Editor de Supabase ANTES de publicar el código
-- (se puede ejecutar más de una vez). No toca ninguna policy (RLS).
--
-- Una cuenta inhabilitada no puede iniciar sesión ni ver precios ni comprar
-- hasta que el administrador la reactive desde /admin/solicitudes.
-- ============================================================
alter table perfiles drop constraint if exists perfiles_estado_check;
alter table perfiles add constraint perfiles_estado_check
  check (estado in ('pendiente', 'aprobado', 'rechazado', 'inhabilitado'));
