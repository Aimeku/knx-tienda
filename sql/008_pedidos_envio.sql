-- ============================================================
-- Migración: gastos de envío en los pedidos
-- Ejecutar en el SQL Editor de Supabase ANTES de publicar el código
-- (se puede ejecutar más de una vez).
-- 15 € + IVA (18,15 €); gratis desde 1.000 € netos (1.210 € con IVA) (src/lib/tienda.ts).
-- ============================================================
alter table pedidos add column if not exists envio numeric(10,2) not null default 0;
