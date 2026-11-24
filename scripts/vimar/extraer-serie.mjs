// Extrae los productos de una sección del catálogo web de Vimar a un JSON local.
// No toca Supabase: solo genera el fichero para revisarlo e importarlo después.
//
// Uso:
//   node scripts/vimar/extraer-serie.mjs <nodo> <salida.json>
//   node scripts/vimar/extraer-serie.mjs A0L101L216 data/vimar/linea.json   (serie LINEA)
//   node scripts/vimar/extraer-serie.mjs codigos=31480.B,31480.C data/vimar/x.json  (referencias sueltas)
//
// Va despacio a propósito (una petición por segundo) para no cargar la web de Vimar.

import fs from 'node:fs';
import path from 'node:path';

const [nodo, salida] = process.argv.slice(2);
if (!nodo || !salida) {
  console.error('Uso: node scripts/vimar/extraer-serie.mjs <nodo> <salida.json>');
  process.exit(1);
}

const BASE = 'https://www.vimar.com';
const PAUSA_MS = 1000;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function descargar(url, intentos = 3) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (AVCI catalog import)', 'Accept-Language': 'es' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === intentos) throw e;
      await espera(PAUSA_MS * 3 * i);
    }
  }
}

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function limpiar(s = '') {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
      if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENTIDADES[e.toLowerCase()] ?? m;
    })
    .replace(/[˝"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
const absoluta = (u) => (u.startsWith('http') ? u : BASE + u);
const unicos = (arr) => [...new Set(arr)];
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parsearFicha(html, codigo) {
  const nombre = limpiar(html.match(/<h1[^>]*>\s*<span class="d-block">([\s\S]*?)<\/span>/)?.[1]);
  const ruta = limpiar(html.match(new RegExp(`<dt>${escapar(codigo)}</dt>\\s*<dd>([\\s\\S]*?)</dd>`))?.[1]);
  const descripcion = nombre
    ? limpiar(html.match(new RegExp(`<dt>${escapar(nombre.replace(/&/g, '&amp;'))}</dt>\\s*<dd>([\\s\\S]*?)</dd>`))?.[1] ??
        html.match(new RegExp(`<dt>${escapar(nombre)}</dt>\\s*<dd>([\\s\\S]*?)</dd>`))?.[1])
    : '';
  const estado = limpiar(html.match(/<dt>Estado producto<\/dt>\s*<dd>([\s\S]*?)<\/dd>/)?.[1]);

  const imagen = html.match(/href="([^"]*z_catalogo\/MAIN_IMAGE\/[^"]+)"/)?.[1] ?? null;
  const fichaPdf = html.match(/href="([^"]*download-pdf\/code\/[^"]+)"/)?.[1]?.replace(/&amp;/g, '&') ?? null;

  const dibujos = unicos([...html.matchAll(/href="([^"]*z_catalogo\/[^"]*\.(?:PNG|DXF|DWG|png|dxf|dwg))"/g)].map((m) => absoluta(m[1])))
    .filter((u) => !u.includes('MAIN_IMAGE'))
    .map((url) => ({ tipo: url.split('.').pop().toUpperCase(), url }));

  const certificados = unicos([...html.matchAll(/title="([^"]+)"><a target="_blank" href="([^"]*CERTIFICATE[^"]+)"/g)].map((m) => `${limpiar(m[1])}|${m[2]}`)).map((s) => {
    const [titulo, url] = s.split('|');
    return { titulo, url };
  });

  // Datos técnicos ETIM: <strong>Etiqueta</strong><br> Valor
  const etim = [...html.matchAll(/<strong>([^<]+)<\/strong><br>\s*([^<]*)<\/div>/g)].map((m) => ({ titulo: limpiar(m[1]), valor: limpiar(m[2]) }));

  const pedidoMinimo = limpiar(html.match(/Cant\. mínima de pedido<\/strong>:\s*([^<]+)/)?.[1]) || null;

  // Bloques de código de barras: EAN, cantidad, medidas, peso
  const embalajes = [...html.matchAll(/<div class="card-body p-0 small my-2">([\s\S]*?)<\/div><\/div><\/div><\/div>/g)].map((m) => {
    const [ean, cantidad, medidas, peso] = [...m[1].matchAll(/<div class="card-text no-wrap">([^<]*)/g)].map((x) => limpiar(x[1]));
    return { ean, cantidad, medidas, peso };
  });

  const bloqueRelacionados = html.split('Podría interesarte también')[1]?.split('product-tabs')[0] ?? '';
  const relacionados = unicos([...bloqueRelacionados.matchAll(/href="\/es\/int\/catalog\/product\/index\/code\/([^"?]+)"/g)].map((m) => decodeURIComponent(m[1])));

  return {
    codigo,
    nombre,
    descripcion,
    ruta,
    estado,
    imagen,
    ficha_pdf: fichaPdf,
    dibujos,
    certificados,
    etim,
    pedido_minimo: pedidoMinimo,
    ean: embalajes[0]?.ean ?? null,
    embalajes,
    relacionados,
    url: `${BASE}/es/int/catalog/product/index/code/${encodeURIComponent(codigo)}`,
  };
}

// 1. Recorre las páginas del listado hasta que no aparezcan códigos nuevos
//    (o usa la lista de referencias si se pasa "codigos=...").
const listaFija = nodo.startsWith('codigos=') ? nodo.slice(8).split(',').filter(Boolean) : null;
const codigos = listaFija ? [...listaFija] : [];
for (let pagina = 1; !listaFija && pagina < 200; pagina++) {
  let html;
  try {
    html = await descargar(`${BASE}/es/int/catalog/product/index/liv/${nodo}?page=${pagina}`, 1);
  } catch {
    break; // después de la última página Vimar responde 404
  }
  const nuevos = unicos([...html.matchAll(new RegExp(`href="/es/int/catalog/product/index/code/([^"?]+)\\?node=${nodo}"`, 'g'))].map((m) => decodeURIComponent(m[1]))).filter(
    (c) => !codigos.includes(c)
  );
  if (nuevos.length === 0) break;
  codigos.push(...nuevos);
  console.log(`Listado página ${pagina}: +${nuevos.length} (total ${codigos.length})`);
  await espera(PAUSA_MS);
}

// 2. Descarga cada ficha. Si el fichero de salida ya existe, reanuda donde lo dejó.
fs.mkdirSync(path.dirname(salida), { recursive: true });
const previos = fs.existsSync(salida) ? JSON.parse(fs.readFileSync(salida, 'utf8')) : [];
const porCodigo = new Map(previos.map((p) => [p.codigo, p]));
const errores = [];

for (const [i, codigo] of codigos.entries()) {
  if (porCodigo.has(codigo)) continue;
  try {
    const html = await descargar(`${BASE}/es/int/catalog/product/index/code/${encodeURIComponent(codigo)}${listaFija ? '' : `?node=${nodo}`}`);
    porCodigo.set(codigo, parsearFicha(html, codigo));
    console.log(`[${i + 1}/${codigos.length}] ${codigo}`);
  } catch (e) {
    errores.push({ codigo, error: String(e) });
    console.warn(`[${i + 1}/${codigos.length}] ${codigo} ERROR ${e}`);
  }
  if ((i + 1) % 25 === 0) fs.writeFileSync(salida, JSON.stringify([...porCodigo.values()], null, 2));
  await espera(PAUSA_MS);
}

// El listado de Vimar a veces devuelve menos páginas: no se pierden las
// fichas ya descargadas en ejecuciones anteriores.
const productos = [...new Set([...codigos, ...porCodigo.keys()])].map((c) => porCodigo.get(c)).filter(Boolean);
fs.writeFileSync(salida, JSON.stringify(productos, null, 2));
console.log(`\nListo: ${productos.length} productos en ${salida}. Errores: ${errores.length}`);
if (errores.length) console.log(errores);
