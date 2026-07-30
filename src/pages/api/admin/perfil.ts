export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { createServerSupabase } from '../../../lib/supabase-server';
import { esAdmin } from '../../../lib/admin';
import { enviarEmail } from '../../../lib/email';

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

  const nuevoEstado = accion === 'aprobar' ? 'aprobado' : 'rechazado';

  const { data: perfil, error } = await supabaseAdmin
    .from('perfiles')
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('email, nombre')
    .single();

  if (error || !perfil) {
    return new Response(JSON.stringify({ error: 'No se pudo actualizar el perfil.' }), { status: 500 });
  }

  await enviarEmail({
    to: perfil.email,
    subject: nuevoEstado === 'aprobado' ? 'Tu cuenta en avci.es ya está activa' : 'Sobre tu solicitud de cuenta en avci.es',
    html:
      nuevoEstado === 'aprobado'
        ? `<p>Hola ${perfil.nombre},</p><p>Tu cuenta ya ha sido aprobada. Ya puedes iniciar sesión en <a href="https://avci.es/cuenta">avci.es/cuenta</a>.</p>`
        : `<p>Hola ${perfil.nombre},</p><p>Hemos revisado tu solicitud de cuenta y, de momento, no ha sido aprobada. Si crees que es un error, escríbenos a info@avci.es.</p>`,
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
