import { createBrowserClient } from '@supabase/ssr';

// Cliente de Supabase para usar dentro de <script> en el navegador (login,
// registro...). Guarda la sesión en cookies (en vez de localStorage) para
// que el servidor pueda leerla en cada petición a través del middleware.
export const supabaseBrowser = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);
