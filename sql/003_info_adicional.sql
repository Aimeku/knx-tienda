-- ============================================================
-- Migración: tabla de "Información adicional" de la ficha de producto
-- Ejecutar en el SQL Editor de Supabase (después de 002_...)
-- ============================================================

-- Filas fijas de la pestaña "Información adicional" (Serie/Modelo, Protocolo, etc.).
-- Marca, Canales e Inputs NO se guardan aquí: se toman de producto.marca y de las
-- variantes ya existentes, para no tener el mismo dato duplicado en dos sitios.
-- Mismo formato que "especificaciones": [{ "titulo": "...", "valor": "..." | ["..."] }]
alter table productos
  add column if not exists info_adicional jsonb;
