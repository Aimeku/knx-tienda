import { localizedHref, type Lang } from '../i18n/ui';

// Interruptor de la tienda.
// false = modo "Próximamente": el catálogo, las fichas de producto, el carrito
// y el checkout redirigen a /proximamente y no se consulta Supabase para ellos.
// Para reactivar la tienda basta con ponerlo a true (y, si quieres, volver a
// poner `prerender = true` en src/pages/carrito.astro).
export const TIENDA_ACTIVA = false;

export const RUTA_PROXIMAMENTE = '/proximamente';

// Rutas que solo pertenecen a la tienda (se redirigen mientras esté inactiva).
export function esRutaTienda(pathname: string): boolean {
  return /^\/(productos|carrito)(\/|$)/.test(pathname);
}

// Enlace a la tienda: la ruta real si está activa, o "Próximamente" en el
// idioma de la página si no lo está.
export function hrefTienda(path: string, lang: Lang): string {
  return TIENDA_ACTIVA ? path : localizedHref(RUTA_PROXIMAMENTE, lang);
}
