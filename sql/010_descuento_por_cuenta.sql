-- ============================================================
-- Migración: código de descuento asignado a una cuenta
-- Ejecutar en el SQL Editor de Supabase ANTES de publicar el código
-- (se puede ejecutar más de una vez). No toca ninguna policy (RLS).
--
-- Si la cuenta tiene un código de porcentaje válido, el cliente ve todos los
-- precios con ese descuento (normal tachado, nuevo en rojo) y se le aplica
-- solo al hacer el pedido. Se asigna desde /admin/solicitudes.
-- ============================================================
alter table perfiles add column if not exists codigo_descuento text
  references codigos_descuento(codigo) on update cascade on delete set null;
