export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { createServerSupabase } from '../../../lib/supabase-server';
import { esAdmin } from '../../../lib/admin';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(request, cookies);
  const { data } = await supabase.auth.getUser();

  if (!esAdmin(data.user?.email)) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), { status: 403 });
  }

  const { id, accion } = (await request.json()) ?? {};
  if (!id || (accion !== 'aprobar' && accion !== 'rechazar')) {
    return new Response(JSON.stringify({ error: 'Petición inválida.' }), { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('perfiles')
    .update({ estado: accion === 'aprobar' ? 'aprobado' : 'rechazado', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: 'No se pudo actualizar el perfil.' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
