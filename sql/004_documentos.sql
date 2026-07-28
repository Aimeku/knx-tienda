-- ============================================================
-- Migración: varios documentos descargables por producto
-- Ejecutar en el SQL Editor de Supabase (después de 003_...)
-- ============================================================

-- Lista de documentos para la pestaña "Documentación" de la ficha de producto.
-- Cada elemento: { "titulo": "Manual de producto", "url": "https://.../manual.pdf" }
-- Sustituye/complementa a datasheet_url, que sigue funcionando como documento único
-- de respaldo si "documentos" está vacío.
alter table productos
  add column if not exists documentos jsonb;
