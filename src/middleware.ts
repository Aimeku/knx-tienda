import { defineMiddleware } from 'astro:middleware';
import { createServerSupabase } from './lib/supabase-server';

// Se ejecuta en cada petición: averigua si hay un usuario con sesión
// iniciada (leyendo las cookies) y lo deja disponible en Astro.locals.user
// para cualquier página, sin que cada una tenga que repetir esta lógica.
export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerSupabase(context.request, context.cookies);
  const { data } = await supabase.auth.getUser();
  context.locals.user = data.user;
  return next();
});
