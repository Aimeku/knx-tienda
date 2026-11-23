// Descarga la foto principal de cada producto extraído de Vimar y genera dos
// versiones WebP ligeras dentro de public/ (servidas por Vercel, sin Supabase):
//   public/productos/vimar/<codigo>-400.webp  -> miniatura del catálogo
//   public/productos/vimar/<codigo>-800.webp  -> imagen de la ficha
//
// Uso: node scripts/vimar/descargar-fotos.mjs data/vimar/linea.json
// Se puede relanzar: salta las fotos que ya existen.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [entrada] = process.argv.slice(2);
if (!entrada) {
  console.error('Uso: node scripts/vimar/descargar-fotos.mjs <productos.json>');
  process.exit(1);
}

const DESTINO = 'public/productos/vimar';
const PAUSA_MS = 1000;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
export const nombreFoto = (codigo) => codigo.toLowerCase().replace(/[^a-z0-9]+/g, '-');

fs.mkdirSync(DESTINO, { recursive: true });
const productos = JSON.parse(fs.readFileSync(entrada, 'utf8')).filter((p) => p.imagen);
const errores = [];

for (const [i, p] of productos.entries()) {
  const base = path.join(DESTINO, nombreFoto(p.codigo));
  if (fs.existsSync(`${base}-800.webp`) && fs.existsSync(`${base}-400.webp`)) continue;
  try {
    const res = await fetch(p.imagen, { headers: { 'User-Agent': 'Mozilla/5.0 (AVCI catalog import)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const original = Buffer.from(await res.arrayBuffer());
    for (const ancho of [800, 400]) {
      await sharp(original)
        .flatten({ background: '#ffffff' })
        .resize({ width: ancho, height: ancho, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(`${base}-${ancho}.webp`);
    }
    console.log(`[${i + 1}/${productos.length}] ${p.codigo}`);
  } catch (e) {
    errores.push({ codigo: p.codigo, error: String(e) });
    console.warn(`[${i + 1}/${productos.length}] ${p.codigo} ERROR ${e}`);
  }
  await espera(PAUSA_MS);
}

console.log(`\nListo. Errores: ${errores.length}`);
if (errores.length) console.log(errores);
