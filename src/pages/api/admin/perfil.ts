export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { createServerSupabase } from '../../../lib/supabase-server';
import { esAdmin } from '../../../lib/admin';
import { enviarEmail } from '../../../lib/email';
import { normalizarCodigo, escaparHtml } from '../../../lib/pedidos';

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

  const cuerpo = (await request.json().catch(() => ({}))) ?? {};
  const { id, accion } = cuerpo;

  if (accion === 'crear_codigo') return crearCodigo(cuerpo);
  if (accion === 'activar_codigo') return activarCodigo(cuerpo);
  if (accion === 'asignar_codigo' && typeof id === 'string') return asignarCodigo(id, cuerpo.codigo);

  if (accion === 'eliminar' && typeof id === 'string') {
    return eliminarCuenta(id, data.user!.id);
  }
  if ((accion === 'inhabilitar' || accion === 'reactivar') && typeof id === 'string') {
    return cambiarHabilitada(id, data.user!.id, accion === 'reactivar');
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
        ? `<p>Hola ${escaparHtml(perfil.nombre)},</p><p>Tu cuenta ya ha sido aprobada. Ya puedes iniciar sesión en <a href="https://avci.es/cuenta">avci.es/cuenta</a>.</p>`
        : `<p>Hola ${escaparHtml(perfil.nombre)},</p><p>Hemos revisado tu solicitud de cuenta y, de momento, no ha sido aprobada. Si crees que es un error, escríbenos a info@avci.es.</p>`,
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

// Inhabilita una cuenta (estado 'inhabilitado' + bloqueo de inicio de sesión
// en Supabase Auth) o la reactiva (vuelve a 'aprobado' y se quita el bloqueo).
async function cambiarHabilitada(id: string, adminId: string, reactivar: boolean) {
  const responder = (cuerpo: unknown, status: number) =>
    new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

  if (id === adminId) return responder({ error: 'No puedes inhabilitar tu propia cuenta.' }, 400);
  const { data: perfil } = await supabaseAdmin.from('perfiles').select('email').eq('id', id).maybeSingle();
  if (!perfil) return responder({ error: 'Esa cuenta no existe.' }, 404);
  if (esAdmin(perfil.email)) return responder({ error: 'No se puede inhabilitar una cuenta de administrador.' }, 400);

  const { error } = await supabaseAdmin
    .from('perfiles')
    .update({ estado: reactivar ? 'aprobado' : 'inhabilitado', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('[admin] Error cambiando estado:', error);
    return responder({ error: 'No se pudo cambiar el estado. ¿Has ejecutado sql/009_perfiles_inhabilitado.sql?' }, 500);
  }

  // Bloqueo en Supabase Auth: impide iniciar sesión y renovar la sesión abierta.
  const { error: errorBloqueo } = await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: reactivar ? 'none' : '876000h', // ~100 años = hasta que se reactive
  });
  if (errorBloqueo) console.error('[admin] Error con el bloqueo de inicio de sesión:', errorBloqueo);

  return responder({ ok: true }, 200);
}

// ---------- Códigos de descuento ----------
const responderJson = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

// Crea un código de porcentaje (p. ej. INSTALADOR15 = 15 %).
async function crearCodigo(cuerpo: Record<string, unknown>) {
  const codigo = normalizarCodigo(cuerpo.codigo);
  const valor = Math.round(Number(cuerpo.porcentaje) * 100) / 100;
  const caduca = typeof cuerpo.caduca === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cuerpo.caduca) ? `${cuerpo.caduca}T23:59:59` : null;
  const descripcion = String(cuerpo.descripcion ?? '').trim().slice(0, 200) || null;
  if (codigo.length < 3) return responderJson({ error: 'El código debe tener al menos 3 letras o números.' }, 400);
  if (!(valor > 0 && valor <= 100)) return responderJson({ error: 'El porcentaje tiene que estar entre 0,01 y 100.' }, 400);

  const { error } = await supabaseAdmin.from('codigos_descuento').insert({ codigo, tipo: 'porcentaje', valor, caduca, descripcion });
  if (error) {
    return responderJson({ error: error.code === '23505' ? `Ya existe un código ${codigo}.` : 'No se pudo crear el código.' }, 400);
  }
  return responderJson({ ok: true });
}

async function activarCodigo(cuerpo: Record<string, unknown>) {
  const codigo = normalizarCodigo(cuerpo.codigo);
  const { error } = await supabaseAdmin.from('codigos_descuento').update({ activo: cuerpo.activo === true }).eq('codigo', codigo);
  return error ? responderJson({ error: 'No se pudo cambiar el código.' }, 500) : responderJson({ ok: true });
}

// Asigna (o quita, con codigo vacío) el código de descuento de una cuenta.
async function asignarCodigo(id: string, codigoBruto: unknown) {
  const codigo = normalizarCodigo(codigoBruto) || null;
  if (codigo) {
    const { data } = await supabaseAdmin.from('codigos_descuento').select('tipo').eq('codigo', codigo).maybeSingle();
    if (!data) return responderJson({ error: 'Ese código no existe.' }, 400);
    if (data.tipo !== 'porcentaje') return responderJson({ error: 'A una cuenta solo se le pueden asignar códigos de porcentaje.' }, 400);
  }
  const { error } = await supabaseAdmin.from('perfiles').update({ codigo_descuento: codigo }).eq('id', id);
  if (error) {
    console.error('[admin] Error asignando código:', error);
    return responderJson({ error: 'No se pudo asignar el código. ¿Has ejecutado sql/010_descuento_por_cuenta.sql?' }, 500);
  }
  return responderJson({ ok: true });
}
