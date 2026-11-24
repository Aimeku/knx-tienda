-- Smart Home KNX: quitar lectores RFID y detector IR (no borra nada: activo = false)
-- y renombrar la categoría "Mandos, pantallas y termostatos" -> "Mandos y termostatos".
update productos set activo = false, updated_at = now()
where sku in ('30565.B', '30565.C', '30565.G', '30565.TRB', '30565.TRC', '30565.TRG',
              '30566.B', '30566.C', '30566.G', '30575.B', '30575.C', '30575.G');

update categorias set nombre = 'KNX · Mandos y termostatos' where slug = 'vimar-knx-dispositivos';

-- El tipo que sale en la ficha de cada producto
update productos
set info_adicional = (
  select jsonb_agg(case when e->>'titulo' = 'Tipo' then jsonb_set(e, '{valor}', '"Mandos y termostatos"') else e end)
  from jsonb_array_elements(info_adicional) e
)
where categoria_id = (select id from categorias where slug = 'vimar-knx-dispositivos');

-- Comprobación: debe salir 418
select count(*) filter (where activo) as visibles from productos where marca = 'Vimar';
