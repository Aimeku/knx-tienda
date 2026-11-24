// Convierte el JSON extraído de Vimar en ficheros SQL para pegar en el
// SQL Editor de Supabase (igual que los seeds de sql/seeds/).
//
// Uso:
//   node scripts/vimar/generar-sql.mjs data/vimar/linea.json sql/seeds/vimar-linea
//
// - Crea las categorías de la serie si no existen.
// - Inserta los productos; si ya existen (mismo SKU) actualiza textos, fotos y
//   documentos, pero NUNCA toca precio, precio_oferta, stock ni activo.
// - Traduce los datos técnicos ETIM con data/vimar/etim-es.json.
// - Omite los artículos que Vimar tiene en "Bloqueo de pedidos" y los de
//   otros mercados listados en data/vimar/excluir.json.

import fs from 'node:fs';
import path from 'node:path';

const [entrada, carpetaSalida] = process.argv.slice(2);
if (!entrada || !carpetaSalida) {
  console.error('Uso: node scripts/vimar/generar-sql.mjs <productos.json> <carpeta-salida>');
  process.exit(1);
}

const SERIE = 'Linea';
const PRODUCTOS_POR_FICHERO = 80;

// Último tramo de la ruta de Vimar -> categoría de la tienda
const CATEGORIAS = {
  Dispositivos: { slug: 'vimar-linea-mecanismos', nombre: 'Linea · Mecanismos', orden: 100 },
  Placas: { slug: 'vimar-linea-placas', nombre: 'Linea · Placas', orden: 101 },
  Botones: { slug: 'vimar-linea-teclas', nombre: 'Linea · Teclas y botones', orden: 102 },
  'Tapa ciega': { slug: 'vimar-linea-accesorios', nombre: 'Linea · Accesorios y soportes', orden: 103 },
  Soportes: { slug: 'vimar-linea-accesorios', nombre: 'Linea · Accesorios y soportes', orden: 103 },
  Accesorios: { slug: 'vimar-linea-accesorios', nombre: 'Linea · Accesorios y soportes', orden: 103 },
};

const { etiquetas, valores } = JSON.parse(fs.readFileSync('data/vimar/etim-es.json', 'utf8'));
const nombreFoto = (codigo) => codigo.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// "230,00 - 230,01 V" -> "230 V"; "1,50 - 4,00 mm2" se queda como rango.
function traducirValor(v) {
  if (valores[v]) return valores[v];
  let s = v.replace(/\bHZ\b/g, 'Hz').replace(/\bmm2\b/g, 'mm²');
  const rango = s.match(/^([\d.]+,\d+) - ([\d.]+,\d+) (.+)$/);
  if (rango) {
    const num = (x) => parseFloat(x.replace(/\./g, '').replace(',', '.'));
    const [a, b] = [num(rango[1]), num(rango[2])];
    if (Math.abs(b - a) <= 0.011) s = `${String(a).replace('.', ',')} ${rango[3]}`;
  }
  return s.replace(/^(\d+),00 /, '$1 ');
}

const TIPO_DIBUJO = { '2DIMAGESIZE': 'Dimensiones', '2DIMAGEREAR': 'Vista posterior', '3DIMAGE': 'Vista 3D' };

function documentos(p) {
  const docs = [];
  if (p.ficha_pdf) docs.push({ titulo: 'Ficha técnica (PDF)', url: p.ficha_pdf });
  for (const d of p.dibujos) {
    const carpeta = d.url.match(/z_catalogo\/([^/]+)\//)?.[1];
    docs.push({ titulo: `${TIPO_DIBUJO[carpeta] ?? 'Dibujo'} (${d.tipo})`, url: d.url });
  }
  for (const c of p.certificados) docs.push({ titulo: `Certificado ${c.titulo.replace(/^\d+\.\s*/, '')} (PDF)`, url: c.url });
  return docs;
}

function infoAdicional(p, tipo) {
  const filas = [
    { titulo: 'Referencia Vimar', valor: p.codigo },
    { titulo: 'EAN', valor: p.ean },
    { titulo: 'Serie', valor: `Vimar ${SERIE}` },
    { titulo: 'Tipo', valor: CATEGORIAS[tipo].nombre.replace(`${SERIE} · `, '') },
  ];
  if (p.pedido_minimo) filas.push({ titulo: 'Pedido mínimo', valor: p.pedido_minimo.replace(/ NR$/, ' uds.') });
  if (p.embalajes.length) {
    filas.push({
      titulo: 'Embalajes',
      valor: p.embalajes.map((e) => `${e.cantidad.replace(/ NR$/, ' uds.')}: ${e.medidas.replace(' [cm]', ' cm')}, ${e.peso?.replace(' [g]', ' g') ?? ''} (EAN ${e.ean})`),
    });
  }
  return filas.filter((f) => f.valor);
}

const sql = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const json = (v) => `${sql(JSON.stringify(v))}::jsonb`;

// Referencias de otros mercados que no se venden (ver data/vimar/excluir.json).
const excluir = new Set(
  Object.entries(JSON.parse(fs.readFileSync('data/vimar/excluir.json', 'utf8')))
    .filter(([clave]) => !clave.startsWith('_'))
    .flatMap(([, codigos]) => codigos)
);

const todos = JSON.parse(fs.readFileSync(entrada, 'utf8'));
const productos = todos.filter((p) => !/bloqueo/i.test(p.estado) && !excluir.has(p.codigo) && CATEGORIAS[p.ruta.split(' / ').pop()]);
const omitidos = todos.length - productos.length;

const filas = productos.map((p) => {
  const tipo = p.ruta.split(' / ').pop();
  const cat = CATEGORIAS[tipo];
  const foto = fs.existsSync(`public/productos/vimar/${nombreFoto(p.codigo)}-800.webp`) ? `/productos/vimar/${nombreFoto(p.codigo)}-800.webp` : null;
  const especificaciones = p.etim.map((e) => ({ titulo: etiquetas[e.titulo] ?? e.titulo, valor: traducirValor(e.valor) }));
  return `(
  (select id from categorias where slug = ${sql(cat.slug)}),
  ${sql(p.codigo)}, ${sql(p.nombre)}, ${sql(`vimar-${nombreFoto(p.codigo)}-${slugify(p.nombre)}`.slice(0, 120))},
  ${sql(p.descripcion || p.nombre)}, ${sql(p.descripcion || p.nombre)},
  'Vimar', 0, 0, true,
  ${sql(p.ficha_pdf)}, ${sql(foto)},
  ${json(especificaciones)},
  ${json(infoAdicional(p, tipo))},
  ${json(documentos(p))}
)`;
});

const categoriasUnicas = [...new Map(Object.values(CATEGORIAS).map((c) => [c.slug, c])).values()];
const cabecera = (n, total) => `-- ============================================================
-- Vimar ${SERIE}: parte ${n} de ${total}
-- Generado con scripts/vimar/generar-sql.mjs desde ${entrada}
-- Ejecutar en el SQL Editor de Supabase, en orden (parte 01 primero).
-- Precio = 0: se actualizará con la tarifa de Vimar. Volver a ejecutarlo
-- no modifica precio, precio_oferta, stock ni activo.
-- ============================================================
`;

fs.mkdirSync(carpetaSalida, { recursive: true });
const partes = [];
for (let i = 0; i < filas.length; i += PRODUCTOS_POR_FICHERO) partes.push(filas.slice(i, i + PRODUCTOS_POR_FICHERO));

partes.forEach((grupo, i) => {
  const n = String(i + 1).padStart(2, '0');
  let contenido = cabecera(n, String(partes.length).padStart(2, '0'));
  if (i === 0) {
    contenido += `\ninsert into categorias (nombre, slug, orden) values\n${categoriasUnicas
      .map((c) => `  (${sql(c.nombre)}, ${sql(c.slug)}, ${c.orden})`)
      .join(',\n')}\non conflict (slug) do nothing;\n`;
  }
  contenido += `
insert into productos (
  categoria_id, sku, nombre, slug, descripcion_corta, descripcion_larga,
  marca, precio, stock, activo, datasheet_url, imagen_principal,
  especificaciones, info_adicional, documentos
) values
${grupo.join(',\n')}
on conflict (sku) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  descripcion_corta = excluded.descripcion_corta,
  descripcion_larga = excluded.descripcion_larga,
  marca = excluded.marca,
  datasheet_url = excluded.datasheet_url,
  imagen_principal = excluded.imagen_principal,
  especificaciones = excluded.especificaciones,
  info_adicional = excluded.info_adicional,
  documentos = excluded.documentos,
  updated_at = now();
`;
  fs.writeFileSync(path.join(carpetaSalida, `parte-${n}.sql`), contenido);
});

console.log(`${productos.length} productos en ${partes.length} ficheros (${carpetaSalida}). Omitidos: ${omitidos}.`);
const sinTraducir = new Set();
productos.forEach((p) => p.etim.forEach((e) => !etiquetas[e.titulo] && sinTraducir.add(e.titulo)));
if (sinTraducir.size) console.log('Etiquetas ETIM sin traducir:', [...sinTraducir]);
