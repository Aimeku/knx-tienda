export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { email, password, nombre, apellidos, empresa, cifNif, tipoProfesional, direccion } = body ?? {};

  if (!email || !password || !nombre || !apellidos || !empresa || !cifNif || !tipoProfesional || !direccion) {
    return new Response(JSON.stringify({ error: 'Faltan campos obligatorios.' }), { status: 400 });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres.' }), { status: 400 });
  }

  // Creamos el usuario ya confirmado (email_confirm: true): no hace falta
  // que confirme su email, porque de todas formas no podrá entrar hasta
  // que aprobemos su perfil manualmente.
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError || !userData.user) {
    const mensaje = userError?.message?.includes('already been registered')
      ? 'Ya existe una cuenta con ese correo electrónico.'
      : (userError?.message ?? 'No se pudo crear la cuenta.');
    return new Response(JSON.stringify({ error: mensaje }), { status: 400 });
  }

  const { error: perfilError } = await supabaseAdmin.from('perfiles').insert({
    id: userData.user.id,
    email,
    nombre,
    apellidos,
    empresa,
    cif_nif: cifNif,
    tipo_profesional: tipoProfesional,
    direccion,
    estado: 'pendiente',
  });

  if (perfilError) {
    // Si no se pudo guardar el perfil, no dejamos un usuario de Auth huérfano.
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    return new Response(JSON.stringify({ error: 'No se pudo guardar tu perfil. Inténtalo de nuevo.' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
