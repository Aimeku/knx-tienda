// Convierte el JSON extraído de Vimar en ficheros SQL para pegar en el
// SQL Editor de Supabase (igual que los seeds de sql/seeds/).
//
// Uso:
//   node scripts/vimar/generar-sql.mjs data/vimar/linea.json sql/seeds/vimar-linea            (Linea estándar)
//   node scripts/vimar/generar-sql.mjs data/vimar/linea-knx.json sql/seeds/vimar-linea-knx knx (Smart Home KNX)
//   node scripts/vimar/generar-sql.mjs data/vimar/linea-knx-mecanismos.json sql/seeds/vimar-knx-mecanismos knx-linea
//
// - Crea las categorías de la serie si no existen.
// - Requiere la columna productos.orden (sql/006_orden_productos.sql).
// - Inserta los productos; si ya existen (mismo SKU) actualiza textos, fotos y
//   documentos, pero NUNCA toca precio, precio_oferta, stock ni activo.
// - Traduce los datos técnicos ETIM con data/vimar/etim-es.json.
// - Omite los artículos que Vimar tiene en "Bloqueo de pedidos" y los de
//   otros mercados listados en data/vimar/excluir.json.

import fs from 'node:fs';
import path from 'node:path';
import { ordenProducto, familiaDe } from './orden.mjs';

const [entrada, carpetaSalida, serieArg = 'linea'] = process.argv.slice(2);
if (!entrada || !carpetaSalida) {
  console.error('Uso: node scripts/vimar/generar-sql.mjs <productos.json> <carpeta-salida>');
  process.exit(1);
}

const PRODUCTOS_POR_FICHERO = 80;

// Por serie: nombre y "último tramo de la ruta de Vimar -> categoría de la tienda".
const SERIES = {
  linea: {
    serie: 'Linea',
    categorias: {
      Dispositivos: { slug: 'vimar-linea-mecanismos', nombre: 'Linea · Mecanismos', orden: 100 },
      Placas: { slug: 'vimar-linea-placas', nombre: 'Linea · Placas', orden: 101 },
      Botones: { slug: 'vimar-linea-teclas', nombre: 'Linea · Teclas y botones', orden: 102 },
      'Tapa ciega': { slug: 'vimar-linea-tapas-ciegas', nombre: 'Linea · Tapas ciegas', orden: 104 },
      Soportes: { slug: 'vimar-linea-accesorios', nombre: 'Linea · Accesorios y soportes', orden: 103 },
      Accesorios: { slug: 'vimar-linea-accesorios', nombre: 'Linea · Accesorios y soportes', orden: 103 },
    },
  },
  'knx-linea': {
    serie: 'KNX',
    categorias: {
      Dispositivos: { slug: 'vimar-knx-linea', nombre: 'KNX · Mecanismos Linea', orden: 109 },
      // Medias teclas 31480 para los mandos 30580-30583 (están en By-me Plus en Vimar).
      Botones: { slug: 'vimar-knx-linea', nombre: 'KNX · Mecanismos Linea', orden: 109 },
    },
  },
  'knx-eikon': {
    serie: 'KNX',
    categorias: {
      Dispositivos: { slug: 'vimar-knx-eikon', nombre: 'KNX · Eikon · Táctil', orden: 113 },
      // Soporte 21603 (viene de la serie Eikon tradicional): con los mecanismos.
      Soportes: { slug: 'vimar-knx-eikon', nombre: 'KNX · Eikon · Táctil', orden: 113 },
    },
    // Dentro de Eikon, por referencia: Vintage (palancas) y Flat/Tondo (.AX).
    porCodigo: [
      [/^2258[12]\./, { slug: 'vimar-knx-eikon-vintage', nombre: 'KNX · Eikon · Vintage', orden: 114 }],
      [/\.AX$/, { slug: 'vimar-knx-eikon-flat-tondo', nombre: 'KNX · Eikon · Flat / Tondo', orden: 115 }],
      // Teclas Flat y Tondo para domótica (de Eikon tradicional / Botones).
      [/^22751\./, { slug: 'vimar-knx-eikon-flat-tondo', nombre: 'KNX · Eikon · Flat / Tondo', orden: 115 }],
      // Etiquetas para los mandos Eikon Tactil.
      [/^2184[67]/, { slug: 'vimar-knx-eikon', nombre: 'KNX · Eikon · Táctil', orden: 113 }],
      // Placas (Eikon tradicional / Placas), solo 2M y para paneles:
      // electrónicas 2M -> Táctil; Vintage -> Vintage; Flat y Tondo -> Flat/Tondo.
      [/^21662\./, { slug: 'vimar-knx-eikon', nombre: 'KNX · Eikon · Táctil', orden: 113 }],
      [/^2267[12]\./, { slug: 'vimar-knx-eikon-vintage', nombre: 'KNX · Eikon · Vintage', orden: 114 }],
      [/^(2268[12]|22692)\./, { slug: 'vimar-knx-eikon-flat-tondo', nombre: 'KNX · Eikon · Flat / Tondo', orden: 115 }],
    ],
  },
  // IoT = sistema View Wireless de Vimar (Bluetooth / Zigbee).
  'iot-linea': {
    serie: 'IoT',
    nombreSerie: 'View Wireless (IoT)',
    categorias: {
      Dispositivos: { slug: 'vimar-iot-linea', nombre: 'IoT · Mecanismos Linea', orden: 116 },
      Botones: { slug: 'vimar-iot-linea', nombre: 'IoT · Mecanismos Linea', orden: 116 },
    },
  },
  'iot-eikon': {
    serie: 'IoT',
    nombreSerie: 'View Wireless (IoT)',
    categorias: {
      Dispositivos: { slug: 'vimar-iot-eikon', nombre: 'IoT · Mecanismos Eikon', orden: 117 },
      Botones: { slug: 'vimar-iot-eikon', nombre: 'IoT · Mecanismos Eikon', orden: 117 },
    },
  },
  'iot-comunes': {
    serie: 'IoT',
    nombreSerie: 'View Wireless (IoT)',
    categorias: {
      'Aparatos DIN': { slug: 'vimar-iot-modulos', nombre: 'IoT · Gateways, módulos y sensores', orden: 118 },
      'Componentes no modulares': { slug: 'vimar-iot-modulos', nombre: 'IoT · Gateways, módulos y sensores', orden: 118 },
      // Tarjeta transponder para los lectores RFID/NFC.
      Accesorios: { slug: 'vimar-iot-modulos', nombre: 'IoT · Gateways, módulos y sensores', orden: 118 },
      Dispositivos: { slug: 'vimar-iot-termostatos', nombre: 'IoT · Termostatos', orden: 119 },
    },
  },
  knx: {
    serie: 'KNX',
    categorias: {
      Dispositivos: { slug: 'vimar-knx-dispositivos', nombre: 'KNX · Mandos y termostatos', orden: 110 },
      'Aparatos DIN': { slug: 'vimar-knx-din', nombre: 'KNX · Aparatos DIN y módulos', orden: 111 },
      'Componentes no modulares': { slug: 'vimar-knx-din', nombre: 'KNX · Aparatos DIN y módulos', orden: 111 },
      Software: { slug: 'vimar-knx-software', nombre: 'KNX · Software y accesorios', orden: 112 },
      // La tarjeta transponder va con su programador (01599), en Dispositivos.
      Accesorios: { slug: 'vimar-knx-dispositivos', nombre: 'KNX · Mandos y termostatos', orden: 110 },
    },
  },
};
if (!SERIES[serieArg]) {
  console.error(`Serie desconocida: ${serieArg} (válidas: ${Object.keys(SERIES).join(', ')})`);
  process.exit(1);
}
const { serie: SERIE, nombreSerie: NOMBRE_SERIE = SERIE, categorias: CATEGORIAS, porCodigo: POR_CODIGO = [] } = SERIES[serieArg];
// Categoría de un producto: primero por referencia (si la serie lo define) y
// si no, por el último tramo de la ruta de Vimar.
const categoriaDe = (p) => POR_CODIGO.find(([re]) => re.test(p.codigo))?.[1] ?? CATEGORIAS[p.ruta.split(' / ').pop()];

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

function infoAdicional(p) {
  const filas = [
    { titulo: 'Referencia Vimar', valor: p.codigo },
    { titulo: 'EAN', valor: p.ean },
    { titulo: 'Serie', valor: `Vimar ${NOMBRE_SERIE}` },
    { titulo: 'Tipo', valor: categoriaDe(p).nombre.replace(`${SERIE} · `, '') },
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
const productos = todos.filter((p) => !/bloqueo/i.test(p.estado) && !excluir.has(p.codigo) && categoriaDe(p));
const omitidos = todos.length - productos.length;

// Posición de cada familia (referencia sin color) dentro de su categoría, por código.
const slugDe = (p) => categoriaDe(p).slug;
const posicionFamilia = new Map();
for (const slug of new Set(productos.map(slugDe))) {
  const familias = [...new Set(productos.filter((p) => slugDe(p) === slug).map((p) => familiaDe(p.codigo)))].sort();
  familias.forEach((fam, i) => posicionFamilia.set(`${slug}|${fam}`, i));
}
const ordenDe = (p) => ordenProducto(p.codigo, slugDe(p), posicionFamilia.get(`${slugDe(p)}|${familiaDe(p.codigo)}`));

const filas = productos.map((p) => {
  const cat = categoriaDe(p);
  const foto = fs.existsSync(`public/productos/vimar/${nombreFoto(p.codigo)}-800.webp`) ? `/productos/vimar/${nombreFoto(p.codigo)}-800.webp` : null;
  const especificaciones = p.etim.map((e) => ({ titulo: etiquetas[e.titulo] ?? e.titulo, valor: traducirValor(e.valor) }));
  return `(
  (select id from categorias where slug = ${sql(cat.slug)}),
  ${sql(p.codigo)}, ${sql(p.nombre)}, ${sql(`vimar-${nombreFoto(p.codigo)}-${slugify(p.nombre)}`.slice(0, 120))},
  ${sql(p.descripcion || p.nombre)}, ${sql(p.descripcion || p.nombre)},
  'Vimar', 0, 0, true, ${ordenDe(p)},
  ${sql(p.ficha_pdf)}, ${sql(foto)},
  ${json(especificaciones)},
  ${json(infoAdicional(p))},
  ${json(documentos(p))}
)`;
});

const categoriasUnicas = [...new Map([...Object.values(CATEGORIAS), ...POR_CODIGO.map(([, c]) => c)].map((c) => [c.slug, c])).values()];
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
  marca, precio, stock, activo, orden, datasheet_url, imagen_principal,
  especificaciones, info_adicional, documentos
) values
${grupo.join(',\n')}
on conflict (sku) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  descripcion_corta = excluded.descripcion_corta,
  descripcion_larga = excluded.descripcion_larga,
  marca = excluded.marca,
  orden = excluded.orden,
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
