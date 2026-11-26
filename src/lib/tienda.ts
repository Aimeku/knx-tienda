import { localizedHref, type Lang } from '../i18n/ui';

// Interruptores de la tienda.
//
// TIENDA_ACTIVA
//   false = modo "Próximamente": catálogo, fichas, carrito y checkout redirigen
//           a /proximamente y no se consulta Supabase para ellos.
//   true  = el catálogo y las fichas de producto son visibles.
//
// COMPRAS_ACTIVAS (solo cuenta si TIENDA_ACTIVA es true)
//   false = modo "solo catálogo": sin precios, sin carrito ni checkout; las
//           fichas muestran "Solicitar presupuesto". /carrito redirige a /productos.
//   true  = tienda completa con precios para cuentas aprobadas y compra.
//           Activarlo solo cuando todos los productos tengan precio (no 0 €).
export const TIENDA_ACTIVA = true;
export const COMPRAS_ACTIVAS = true;

// Los precios de Supabase (productos.precio) son PVP SIN IVA. En la web y en
// el cobro se muestran y se cobran con el IVA incluido.
export const IVA = 0.21;

// Envío: tarifa plana de 15 € + IVA; gratis cuando los productos (ya con el
// descuento) suman 1.000 € netos, sin IVA (= 1.210 € con IVA).
export const ENVIO_BASE = 15; // sin IVA
export const ENVIO_GRATIS_DESDE = 1000; // sin IVA
export const gastosEnvio = (importeProductosConIva: number) =>
  importeProductosConIva >= conIva(ENVIO_GRATIS_DESDE) ? 0 : conIva(ENVIO_BASE);
export const conIva = (base: number) => Math.round(base * (1 + IVA) * 100) / 100;
export const formatoPrecio = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

export const RUTA_PROXIMAMENTE = '/proximamente';

// Rutas que solo pertenecen a la tienda (se redirigen mientras esté inactiva).
export function esRutaTienda(pathname: string): boolean {
  return /^\/(productos|carrito)(\/|$)/.test(pathname);
}

// Rutas de compra (se desactivan en modo solo catálogo).
export function esRutaCompra(pathname: string): boolean {
  return /^\/carrito(\/|$)/.test(pathname);
}

// Enlace a la tienda: la ruta real si está activa, o "Próximamente" en el
// idioma de la página si no lo está.
export function hrefTienda(path: string, lang: Lang): string {
  return TIENDA_ACTIVA ? path : localizedHref(RUTA_PROXIMAMENTE, lang);
}
