// Genera sql/seeds/vimar-linea/limpieza-y-orden.sql a partir de los parte-*.sql
// (ejecutar después de generar-sql.mjs). Oculta los grupos de excluir.json
// indicados en OCULTAR, mueve las tapas ciegas a su categoría y fija el orden.
//
// Uso: node scripts/vimar/generar-limpieza.mjs

import fs from 'node:fs';

const CARPETA = 'sql/seeds/vimar-linea';
const OCULTAR = [
  'Formato 3M, 4M y 7M',
  'Accesorios que no se venden',
  'Teclas con altavoz, difusor o luz inferior',
  'Pilotos con difusor',
  'Placas descartadas',
  'Mecanismos descartados',
];

const ex = JSON.parse(fs.readFileSync('data/vimar/excluir.json', 'utf8'));
const ocultos = OCULTAR.flatMap((k) => ex[k]);
const filas = [];
const tapas = [];
for (const f of fs.readdirSync(CARPETA).filter((f) => f.startsWith('parte-'))) {
  const t = fs.readFileSync(`${CARPETA}/${f}`, 'utf8');
  for (const m of t.matchAll(/slug = '([^']+)'\),\s*\n\s*'([^']+)',[\s\S]*?'Vimar', 0, 0, true, (\d+),/g)) {
    filas.push([m[2], +m[3]]);
    if (m[1] === 'vimar-linea-tapas-ciegas') tapas.push(m[2]);
  }
}
filas.sort((a, b) => a[1] - b[1]);
const q = (c) => `'${c}'`;

fs.writeFileSync(`${CARPETA}/limpieza-y-orden.sql`, `-- ============================================================
-- Vimar Linea: limpieza y orden del catálogo
-- Generado con scripts/vimar/generar-limpieza.mjs
-- Ejecutar en el SQL Editor de Supabase (todo el fichero). Se puede volver
-- a ejecutar sin problema. No borra nada: lo que se quita queda con activo = false.
-- ============================================================

-- 1) Columna de orden (igual que sql/006_orden_productos.sql)
alter table productos add column if not exists orden int not null default 999999;
create index if not exists idx_productos_orden on productos(orden);

-- 2) Nueva categoría "Tapas ciegas" y sus ${tapas.length} productos
insert into categorias (nombre, slug, orden) values ('Linea · Tapas ciegas', 'vimar-linea-tapas-ciegas', 104)
on conflict (slug) do nothing;

update productos set categoria_id = (select id from categorias where slug = 'vimar-linea-tapas-ciegas'), updated_at = now()
where sku in (${tapas.map(q).join(', ')});

-- 3) Ocultar ${ocultos.length} productos: ${OCULTAR.join(', ')}
update productos set activo = false, updated_at = now()
where sku in (
  ${ocultos.map(q).join(', ')}
);

-- 4) Orden de los ${filas.length} productos visibles
update productos p set orden = v.orden
from (values
  ${filas.map(([c, o]) => `(${q(c)}, ${o})`).join(',\n  ')}
) as v(sku, orden)
where p.sku = v.sku;

-- Comprobación: debe salir visibles = ${filas.length} y visibles_sin_orden = 0
select
  count(*) filter (where activo) as visibles,
  count(*) filter (where activo and orden = 999999) as visibles_sin_orden,
  count(*) filter (where not activo) as ocultos
from productos where marca = 'Vimar';
`);
console.log(`${filas.length} visibles, ${tapas.length} tapas ciegas, ${ocultos.length} ocultos.`);
