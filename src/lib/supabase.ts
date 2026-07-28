import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente público: úsalo en páginas/componentes para leer el catálogo.
// Respeta las políticas de Row Level Security (solo lectura de productos activos).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cliente de servidor: SOLO úsalo dentro de src/pages/api/*.
// Salta las políticas de RLS, así que nunca lo importes en código que
// se ejecute en el navegador.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export type Especificacion = {
  titulo: string;
  valor: string | string[];
};

export type ProductoVariante = {
  id: string;
  nombre: string;
  sku_variante: string | null;
  precio_extra: number;
  stock: number;
  atributos: Record<string, string> | null;
};

export type Producto = {
  id: string;
  categoria_id: string | null;
  sku: string;
  nombre: string;
  slug: string;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  marca: string | null;
  precio: number;
  precio_oferta: number | null;
  stock: number;
  activo: boolean;
  datasheet_url: string | null;
  imagen_principal: string | null;
  especificaciones: Especificacion[] | null;
  info_adicional: Especificacion[] | null;
};

export type Categoria = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  orden: number;
};
