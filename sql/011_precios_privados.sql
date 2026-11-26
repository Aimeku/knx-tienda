-- ============================================================
-- Migración: los precios dejan de ser legibles con la clave pública
-- ============================================================
-- Hasta ahora cualquiera podía leer productos.precio con la clave pública de
-- Supabase (la que va en la web), aunque la web solo enseñe precios a
-- cuentas aprobadas. Esto quita a los roles públicos (anon y authenticated)
-- el permiso de leer las columnas de precio. El resto de columnas se siguen
-- pudiendo leer igual, y las políticas RLS NO se tocan.
--
-- La web (desde el commit "Precios privados") ya lee los precios con la
-- clave de servidor, así que NO le afecta. EJECUTAR SOLO DESPUÉS de que ese
-- código esté publicado en avci.es.
--
-- Importante para el futuro: si se añade una columna nueva a productos o
-- producto_variantes, la clave pública no podrá leerla hasta volver a
-- ejecutar este archivo (se puede ejecutar las veces que haga falta).
-- ============================================================

do $$
declare
  cols text;
begin
  -- productos: todas las columnas menos precio y precio_oferta
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'productos'
    and column_name not in ('precio', 'precio_oferta');
  execute 'revoke select on public.productos from anon, authenticated';
  execute format('grant select (%s) on public.productos to anon, authenticated', cols);

  -- producto_variantes: todas las columnas menos precio_extra
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'producto_variantes'
    and column_name <> 'precio_extra';
  execute 'revoke select on public.producto_variantes from anon, authenticated';
  execute format('grant select (%s) on public.producto_variantes to anon, authenticated', cols);
end $$;

-- Comprobación: debe salir 0 filas (ningún rol público puede leer precios).
select grantee, table_name, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and privilege_type = 'SELECT'
  and grantee in ('anon', 'authenticated')
  and column_name in ('precio', 'precio_oferta', 'precio_extra');

-- ------------------------------------------------------------
-- MARCHA ATRÁS (solo si algo fallara): deja todo como estaba.
-- grant select on public.productos to anon, authenticated;
-- grant select on public.producto_variantes to anon, authenticated;
-- ------------------------------------------------------------
