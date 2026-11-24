-- Orden manual de los productos en el catálogo (menor = antes).
-- Los productos sin orden asignado salen al final.
alter table productos add column if not exists orden int not null default 999999;
create index if not exists idx_productos_orden on productos(orden);
