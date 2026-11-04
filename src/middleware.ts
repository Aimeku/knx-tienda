import { defineMiddleware } from 'astro:middleware';
import { createServerSupabase } from './lib/supabase-server';
import { TIENDA_ACTIVA, RUTA_PROXIMAMENTE, esRutaTienda } from './lib/tienda';

// Se ejecuta en cada petición: averigua si hay un usuario con sesión
// iniciada (leyendo las cookies) y lo deja disponible en Astro.locals.user
// para cualquier página, sin que cada una tenga que repetir esta lógica.
export const onRequest = defineMiddleware(async (context, next) => {
  // Tienda en modo "Próximamente": cortamos antes de crear el cliente de
  // Supabase, así estas rutas no generan ninguna consulta. Redirección 302
  // (temporal) para que los buscadores no den las URLs por eliminadas.
  if (!TIENDA_ACTIVA) {
    const { pathname } = context.url;
    if (esRutaTienda(pathname)) {
      return context.redirect(RUTA_PROXIMAMENTE, 302);
    }
    if (pathname.startsWith('/api/checkout')) {
      return new Response(JSON.stringify({ error: 'La tienda estará disponible próximamente.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '86400' },
      });
    }
  }

  // Las páginas estáticas (home, proyectos, contacto, próximamente...) se
  // generan en el build y no usan locals.user: no hace falta Supabase.
  if (context.isPrerendered) return next();

  const supabase = createServerSupabase(context.request, context.cookies);
  const { data } = await supabase.auth.getUser();
  context.locals.user = data.user;
  return next();
});
