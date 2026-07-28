-- ============================================================
-- Migración: atributos de variante + especificaciones técnicas
-- Ejecutar en el SQL Editor de Supabase (después de schema.sql)
-- ============================================================

-- Atributos de la variante como pares clave/valor, ej: {"canales": "2", "inputs": "con"}.
-- Permite selectores combinables (Canales / Inputs...) sin fijar columnas por tipo de producto,
-- ya que cada familia de producto puede tener atributos distintos (canales para actuadores,
-- potencia para altavoces, etc.).
alter table producto_variantes
  add column if not exists atributos jsonb;

-- Lista de especificaciones técnicas para la pestaña "Descripción" de la ficha de producto.
-- Cada elemento: { "titulo": "Montaje", "valor": "Carril DIN 35 mm – 6 módulos" }
-- "valor" puede ser un string o un array de strings (para sub-listas).
alter table productos
  add column if not exists especificaciones jsonb;
