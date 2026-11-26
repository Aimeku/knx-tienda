// Estructura de la tienda: la usan el menú "Tienda" (escritorio y móvil),
// los filtros del catálogo y los accesos de la home.
//
// - grupo:   identificador interno (no cambiarlo: lo usan los enlaces de la home).
// - titulo:  lo que ve el cliente.
// - seccion: subapartado opcional dentro de un grupo (ej. una serie de un fabricante).
//            Las categorías con la misma sección deben ir seguidas.
// - visible: false oculta el grupo o la categoría del menú y de los filtros
//            (ej. mientras no tenga productos). Por defecto es visible.

export interface CategoriaTienda {
  nombre: string;
  slug: string;
  seccion?: string;
  visible?: boolean;
}

export interface GrupoTienda {
  grupo: string;
  titulo: string;
  categorias: CategoriaTienda[];
  visible?: boolean;
}

// Estructura completa (incluye lo oculto).
export const tiendaCompleta: GrupoTienda[] = [
  {
    grupo: 'Interruptores/Mecanismos',
    titulo: 'Estándar',
    categorias: [
      { nombre: 'Mecanismos', slug: 'vimar-linea-mecanismos', seccion: 'Vimar Linea' },
      { nombre: 'Placas', slug: 'vimar-linea-placas', seccion: 'Vimar Linea' },
      { nombre: 'Teclas y botones', slug: 'vimar-linea-teclas', seccion: 'Vimar Linea' },
      { nombre: 'Tapas ciegas', slug: 'vimar-linea-tapas-ciegas', seccion: 'Vimar Linea' },
      { nombre: 'Accesorios y soportes', slug: 'vimar-linea-accesorios', seccion: 'Vimar Linea' },
      { nombre: 'Pulsadores', slug: 'pulsadores', seccion: 'Otros', visible: false },
    ],
  },
  {
    grupo: 'Domótica', // la tarjeta "Smart Homes" de la home enlaza aquí
    titulo: 'Smart Home',
    categorias: [
      // Tres sistemas de Vimar: KNX, ByMe y View Wireless. Cada sistema se
      // reparte en secciones "Sistema · Serie"; las que no tienen productos
      // (visible: false) no salen en el menú ni en los filtros.
      // KNX
      { nombre: 'Mecanismos', slug: 'vimar-knx-linea', seccion: 'KNX · Linea' },
      { nombre: 'Táctil', slug: 'vimar-knx-eikon', seccion: 'KNX · Eikon' },
      { nombre: 'Vintage', slug: 'vimar-knx-eikon-vintage', seccion: 'KNX · Eikon' },
      { nombre: 'Flat / Tondo', slug: 'vimar-knx-eikon-flat-tondo', seccion: 'KNX · Eikon' },
      { nombre: 'Aparatos DIN y módulos', slug: 'vimar-knx-din', seccion: 'KNX · Componentes comunes' },
      { nombre: 'Mandos y termostatos', slug: 'vimar-knx-dispositivos', seccion: 'KNX · Componentes comunes', visible: false }, // sin productos por ahora
      { nombre: 'Software', slug: 'vimar-knx-software', seccion: 'KNX · Componentes comunes', visible: false }, // sin productos por ahora
      // ByMe y View Wireless: se añadirán aquí con sus secciones.
      // Categorías antiguas, sin productos por ahora
      { nombre: 'Actuadores', slug: 'actuadores', visible: false },
      { nombre: 'Paneles táctiles', slug: 'paneles-tactiles-knx', visible: false },
      { nombre: 'Sensores', slug: 'sensores', visible: false },
      { nombre: 'Fuentes de alimentación', slug: 'fuentes-de-alimentacion', visible: false },
      { nombre: 'Gateways', slug: 'gateways', visible: false },
      { nombre: 'Interfaces y acopladores', slug: 'interfaces-y-acopladores', visible: false },
      { nombre: 'Servidores', slug: 'servidores', visible: false },
      { nombre: 'Protocolo propietario', slug: 'protocolo-propietario', visible: false },
    ],
  },
  {
    grupo: 'Iluminación / Electricidad',
    titulo: 'Iluminación',
    visible: false, // sin productos por ahora
    categorias: [{ nombre: 'DALI', slug: 'dali' }],
  },
  {
    grupo: 'Sonido',
    titulo: 'Sonido',
    visible: false, // sin productos por ahora
    categorias: [
      { nombre: 'Altavoces de techo', slug: 'altavoces-techo' },
      { nombre: 'Altavoces de pared', slug: 'altavoces-pared' },
      { nombre: 'Altavoces de pie', slug: 'altavoces-pie' },
      { nombre: 'Altavoces de exterior', slug: 'altavoces-exterior' },
      { nombre: 'Amplificadores', slug: 'amplificadores' },
    ],
  },
];

// Lo que ve el cliente: solo grupos y categorías visibles, y sin grupos vacíos.
export const tiendaMenu: GrupoTienda[] = tiendaCompleta
  .filter((g) => g.visible !== false)
  .map((g) => ({ ...g, categorias: g.categorias.filter((c) => c.visible !== false) }))
  .filter((g) => g.categorias.length > 0);

// Todas las categorías (también las ocultas), para poner nombre a cualquier filtro.
export const categorias = tiendaCompleta.flatMap((g) => g.categorias);

// Marcas que aparecen en el menú y en los filtros. Por ahora solo Vimar;
// para volver a mostrar otras, añádelas aquí (ej. 'Interra', 'Sonos').
export const marcasBase = ['Vimar'];

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

// Tarjetas del menú "Tienda": foto y frase de cada sección. Las secciones
// que no estén aquí salen igual, con la lista de sus categorías como frase.
export const destacadosSeccion: Record<string, { foto: string; texto: string }> = {
  'Vimar Linea': { foto: '/productos/vimar/30643-01-400.webp', texto: 'Mecanismos, placas y teclas de diseño' },
  'KNX · Linea': { foto: '/productos/vimar/30580-400.webp', texto: 'Mandos y teclas KNX para la serie Linea' },
  'KNX · Eikon': { foto: '/productos/vimar/22692-rn-82-400.webp', texto: 'Táctil, Vintage, Flat y Tondo' },
  'KNX · Componentes comunes': { foto: '/productos/vimar/01500-2-400.webp', texto: 'Aparatos DIN y módulos KNX' },
};

// URL del catálogo filtrado por un grupo, una categoría o una marca.
export const hrefCategoria = (slug: string) => `/productos?categoria=${encodeURIComponent(slug)}`;
export const hrefMarca = (marca: string) => `/productos?marca=${encodeURIComponent(marca)}`;
export const hrefCategorias = (lista: CategoriaTienda[]) =>
  lista.length ? `/productos?${lista.map((c) => `categoria=${encodeURIComponent(c.slug)}`).join('&')}` : '/productos';
export function hrefGrupoTienda(grupo: GrupoTienda): string {
  if (grupo.categorias.length === 0) return '/productos';
  return `/productos?${grupo.categorias.map((c) => `categoria=${encodeURIComponent(c.slug)}`).join('&')}`;
}
