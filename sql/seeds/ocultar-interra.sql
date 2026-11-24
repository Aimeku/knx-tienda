-- ============================================================
-- Ocultar los productos de Interra (sus fotos y documentos estaban en
-- buckets de Supabase Storage que se han eliminado).
-- Ejecutar en el SQL Editor de Supabase.
--
-- No borra nada: solo los marca como inactivos. Para volver a mostrarlos,
-- cambia "false" por "true" (después de volver a subir sus archivos y
-- actualizar imagen_principal / documentos).
-- ============================================================

update productos set activo = false, updated_at = now()
where marca = 'Interra';

-- Comprobación: productos visibles por marca (debería salir solo Vimar)
select marca, count(*) as visibles
from productos
where activo = true
group by marca;
