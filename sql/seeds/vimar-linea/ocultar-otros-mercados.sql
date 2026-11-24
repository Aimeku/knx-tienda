-- ============================================================
-- Vimar Linea: ocultar productos de otros mercados
-- (Reino Unido, Israel, EE. UU. y tomas euroamericanas)
-- Ejecutar en el SQL Editor de Supabase.
--
-- No borra nada: solo los marca como inactivos (activo = false), así que
-- dejan de verse en la web pero siguen guardados. Lista completa y motivo
-- en data/vimar/excluir.json.
--
-- Para volver a mostrarlos, cambia "false" por "true" y ejecútalo de nuevo.
-- ============================================================

-- Reino Unido (BS): 87 productos
update productos set activo = false, updated_at = now()
where marca = 'Vimar' and sku in (
  '30017.B', '30017.C', '30017.G', '30018.B', '30018.C', '30018.G', '30019.B', '30019.C', '30019.G', '30049.LB', '30049.LC', '30049.LG', '30214.B', '30214.C', '30214.G', '30215.B', '30215.C', '30215.G', '30219.B', '30219.C', '30219.G', '30221.B', '30221.C', '30221.G', '30221.LB', '30221.LC', '30221.LG', '30222.B', '30222.C', '30222.G', '30222.LB', '30222.LC', '30222.LG', '30223.CB', '30223.CC', '30223.CG', '30224.ACB', '30224.ACC', '30224.ACG', '30224.CCB', '30224.CCC', '30224.CCG', '30291.B', '30291.C', '30291.G', '30607', '30608', '30609', '30647.00', '30647.01', '30647.02', '30647.20', '30647.21', '30647.22', '30647.50', '30647.60', '30647.61', '30647.62', '30647.70.01', '30647.71', '30647.72', '30648.00', '30648.01', '30648.02', '30648.20', '30648.21', '30648.22', '30648.50', '30648.60', '30648.61', '30648.62', '30648.70.01', '30648.71', '30648.72', '30649.00', '30649.01', '30649.02', '30649.20', '30649.21', '30649.22', '30649.50', '30649.60', '30649.61', '30649.62', '30649.70.01', '30649.71', '30649.72'
);

-- Israel: 6 productos
update productos set activo = false, updated_at = now()
where marca = 'Vimar' and sku in (
  '30240.B', '30240.C', '30240.G', '30324.B', '30324.C', '30324.G'
);

-- EE. UU.: 9 productos
update productos set activo = false, updated_at = now()
where marca = 'Vimar' and sku in (
  '30242.B', '30242.C', '30242.G', '30243.B', '30243.C', '30243.G', '30296.B', '30296.C', '30296.G'
);

-- Euroamericanas (USA+EU): 9 productos
update productos set activo = false, updated_at = now()
where marca = 'Vimar' and sku in (
  '30234.B', '30234.C', '30234.G', '30248.B', '30248.C', '30248.G', '30249.B', '30249.C', '30249.G'
);

-- Comprobación: debería devolver 111
select count(*) as ocultos from productos where marca = 'Vimar' and activo = false;
