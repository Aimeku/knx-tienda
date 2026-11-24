-- Smart Home KNX: quitar la categoría "Mandos y termostatos" (no borra nada: activo = false)
update productos set activo = false, updated_at = now()
where sku in ('01580', '01581', '01582', '01583', '02972', '02972.B', '02972.M', '02972.N');

-- Comprobación: debe salir 410
select count(*) filter (where activo) as visibles from productos where marca = 'Vimar';
