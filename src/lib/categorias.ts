// Estructura de la tienda: la usan el menú "Tienda" (escritorio y móvil),
// los filtros del catálogo y los accesos de la home.
//
// - grupo:   identificador interno (no cambiarlo: lo usan los enlaces de la home).
// - titulo:  lo que ve el cliente.
// - seccion: subapartado opcional dentro de un grupo (ej. una serie de un fabricante).
//            Las categorías con la misma sección deben ir seguidas.

export interface CategoriaTienda {
  nombre: string;
  slug: string;
  seccion?: string;
}

export interface GrupoTienda {
  grupo: string;
  titulo: string;
  categorias: CategoriaTienda[];
}

export const tiendaMenu: GrupoTienda[] = [
  {
    grupo: 'Interruptores/Mecanismos',
    titulo: 'Interruptores y mecanismos',
    categorias: [
      { nombre: 'Mecanismos', slug: 'vimar-linea-mecanismos', seccion: 'Vimar Linea' },
      { nombre: 'Placas', slug: 'vimar-linea-placas', seccion: 'Vimar Linea' },
      { nombre: 'Teclas y botones', slug: 'vimar-linea-teclas', seccion: 'Vimar Linea' },
      { nombre: 'Accesorios y soportes', slug: 'vimar-linea-accesorios', seccion: 'Vimar Linea' },
      { nombre: 'Pulsadores', slug: 'pulsadores', seccion: 'Otros' },
    ],
  },
  {
    grupo: 'Domótica',
    titulo: 'Domótica KNX',
    categorias: [
      { nombre: 'Actuadores', slug: 'actuadores' },
      { nombre: 'Paneles táctiles', slug: 'paneles-tactiles-knx' },
      { nombre: 'Sensores', slug: 'sensores' },
      { nombre: 'Fuentes de alimentación', slug: 'fuentes-de-alimentacion' },
      { nombre: 'Gateways', slug: 'gateways' },
      { nombre: 'Interfaces y acopladores', slug: 'interfaces-y-acopladores' },
      { nombre: 'Servidores', slug: 'servidores' },
      { nombre: 'Protocolo propietario', slug: 'protocolo-propietario' },
    ],
  },
  {
    grupo: 'Iluminación / Electricidad',
    titulo: 'Iluminación',
    categorias: [{ nombre: 'DALI', slug: 'dali' }],
  },
  {
    grupo: 'Sonido',
    titulo: 'Sonido',
    categorias: [
      { nombre: 'Altavoces de techo', slug: 'altavoces-techo' },
      { nombre: 'Altavoces de pared', slug: 'altavoces-pared' },
      { nombre: 'Altavoces de pie', slug: 'altavoces-pie' },
      { nombre: 'Altavoces de exterior', slug: 'altavoces-exterior' },
      { nombre: 'Amplificadores', slug: 'amplificadores' },
    ],
  },
];

export const categorias = tiendaMenu.flatMap((g) => g.categorias);

// Marcas que siempre aparecen (menú y filtros), aunque todavía no haya productos con ellas.
export const marcasBase = ['Vimar', 'Interra', 'Sonos'];

// Agrupa las categorías de un grupo por sección, respetando el orden.
export function seccionesDe(grupo: GrupoTienda): { seccion?: string; categorias: CategoriaTienda[] }[] {
  const salida: { seccion?: string; categorias: CategoriaTienda[] }[] = [];
  for (const c of grupo.categorias) {
    const ultima = salida[salida.length - 1];
    if (ultima && ultima.seccion === c.seccion) ultima.categorias.push(c);
    else salida.push({ seccion: c.seccion, categorias: [c] });
  }
  return salida;
}

// URL del catálogo filtrado por un grupo, una categoría o una marca.
export const hrefCategoria = (slug: string) => `/productos?categoria=${encodeURIComponent(slug)}`;
export const hrefMarca = (marca: string) => `/productos?marca=${encodeURIComponent(marca)}`;
export function hrefGrupoTienda(grupo: GrupoTienda): string {
  if (grupo.categorias.length === 0) return '/productos';
  return `/productos?${grupo.categorias.map((c) => `categoria=${encodeURIComponent(c.slug)}`).join('&')}`;
}
