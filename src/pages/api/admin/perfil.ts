export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { createServerSupabase } from '../../../lib/supabase-server';
import { esAdmin } from '../../../lib/admin';
import { enviarEmail } from '../../../lib/email';

// ¿La sesión actual es de un administrador? (lo usa el login de /cuenta).
export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(request, cookies);
  const { data } = await supabase.auth.getUser();
  return new Response(JSON.stringify({ admin: esAdmin(data.user?.email) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(request, cookies);
  const { data } = await supabase.auth.getUser();

  if (!esAdmin(data.user?.email)) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), { status: 403 });
  }

  const { id, accion } = (await request.json()) ?? {};

  if (accion === 'eliminar' && typeof id === 'string') {
    return eliminarCuenta(id, data.user!.id);
  }

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

// Borra la cuenta por completo (usuario de Supabase Auth + su perfil). Los
// pedidos que tuviera se conservan, solo se desvinculan de la cuenta.
async function eliminarCuenta(id: string, adminId: string) {
  const responder = (cuerpo: unknown, status: number) =>
    new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

  if (id === adminId) return responder({ error: 'No puedes eliminar tu propia cuenta.' }, 400);

  const { data: perfil } = await supabaseAdmin.from('perfiles').select('email').eq('id', id).maybeSingle();
  const { data: usuario } = await supabaseAdmin.auth.admin.getUserById(id);
  const email = usuario?.user?.email ?? perfil?.email;
  if (!perfil && !usuario?.user) return responder({ error: 'Esa cuenta ya no existe.' }, 404);
  if (esAdmin(email)) return responder({ error: 'No se puede eliminar una cuenta de administrador.' }, 400);

  const { error: errorPedidos } = await supabaseAdmin.from('pedidos').update({ usuario_id: null }).eq('usuario_id', id);
  if (errorPedidos) console.error('[admin] No se pudieron desvincular los pedidos:', errorPedidos);

  if (usuario?.user) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      console.error('[admin] Error eliminando usuario:', error);
      return responder({ error: 'No se pudo eliminar la cuenta.' }, 500);
    }
  }
  // El perfil se borra solo con el usuario (on delete cascade); por si acaso:
  await supabaseAdmin.from('perfiles').delete().eq('id', id);

  return responder({ ok: true }, 200);
}
