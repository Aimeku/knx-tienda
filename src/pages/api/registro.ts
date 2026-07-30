export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { enviarEmail } from '../../lib/email';
import { ADMIN_EMAILS } from '../../lib/admin';

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

  await enviarEmail({
    to: ADMIN_EMAILS,
    subject: `Nueva solicitud de cuenta: ${empresa}`,
    html: `
      <p>Ha llegado una nueva solicitud de cuenta en avci.es:</p>
      <ul>
        <li><strong>Nombre:</strong> ${nombre} ${apellidos}</li>
        <li><strong>Empresa:</strong> ${empresa}</li>
        <li><strong>CIF/NIF:</strong> ${cifNif}</li>
        <li><strong>Tipo de profesional:</strong> ${tipoProfesional}</li>
        <li><strong>Dirección:</strong> ${direccion}</li>
        <li><strong>Email:</strong> ${email}</li>
      </ul>
      <p><a href="https://avci.es/admin/solicitudes">Revisar solicitud</a></p>
    `,
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
