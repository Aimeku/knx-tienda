import type { ImageMetadata } from 'astro';

// Fotografías principales de la web (hero de la home, tarjetas de proyectos y
// cabeceras de las landings). Antes se servían como PNG de ~2,3 MB desde
// Supabase Storage; ahora viven en src/assets/fotos y Astro genera en el build
// versiones WebP del tamaño justo, servidas desde Vercel con caché larga.
// El número coincide con el nombre que tenían en el bucket "Fotos principales".
const modulos = import.meta.glob<{ default: ImageMetadata }>('../assets/fotos/*.webp', { eager: true });

export function foto(numero: number): ImageMetadata {
  const modulo = modulos[`../assets/fotos/${numero}.webp`];
  if (!modulo) throw new Error(`No existe src/assets/fotos/${numero}.webp`);
  return modulo.default;
}
