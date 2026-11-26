export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { enviarEmail } from '../../lib/email';
import { ADMIN_EMAILS } from '../../lib/admin';
import { escaparHtml as e } from '../../lib/pedidos';

const json = (cuerpo: unknown, status: number) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

const TIPOS_PROFESIONAL = ['integrador-pro', 'disenador', 'propietario', 'arquitecto', 'promotora-constructora'];
// Longitud máxima de cada campo (las mismas que en el formulario).
const MAXIMOS = { nombre: 80, apellidos: 80, empresa: 120, cifNif: 20, direccion: 300, email: 254 } as const;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ error: 'Petición inválida.' }, 400);

  // Antispam: el campo trampa es invisible para las personas. Si viene relleno
  // es un bot: se responde "ok" sin crear nada para que no insista.
  if (typeof body.web === 'string' && body.web.trim() !== '') return json({ ok: true }, 200);
  // Antispam: enviado menos de 3 s después de abrir el formulario.
  const abierto = Number(body.abierto);
  if (Number.isFinite(abierto) && Date.now() - abierto < 3000) {
    return json({ error: 'Espera un momento y vuelve a intentarlo.' }, 429);
  }

  // Todos los campos tienen que ser texto, sin pasarse de largo.
  const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const nombre = texto(body.nombre);
  const apellidos = texto(body.apellidos);
  const empresa = texto(body.empresa);
  const cifNif = texto(body.cifNif);
  const direccion = texto(body.direccion);
  const email = texto(body.email).toLowerCase();
  const tipoProfesional = texto(body.tipoProfesional);
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password || !nombre || !apellidos || !empresa || !cifNif || !tipoProfesional || !direccion) {
    return json({ error: 'Faltan campos obligatorios.' }, 400);
  }
  const valores = { nombre, apellidos, empresa, cifNif, direccion, email };
  for (const [campo, max] of Object.entries(MAXIMOS)) {
    if (valores[campo as keyof typeof valores].length > max) return json({ error: 'Alguno de los campos es demasiado largo.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: 'El correo electrónico no es válido.' }, 400);
  if (!TIPOS_PROFESIONAL.includes(tipoProfesional)) return json({ error: 'Elige un tipo de profesional de la lista.' }, 400);
  if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  if (password.length > 72) return json({ error: 'La contraseña no puede tener más de 72 caracteres.' }, 400);

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
    // Lo que escribe quien se registra se escapa: así no puede meter enlaces
    // ni formato en el email que recibe el administrador.
    subject: `Nueva solicitud de cuenta: ${empresa.replace(/[\r\n]+/g, ' ').slice(0, 80)}`,
    html: `
      <p>Ha llegado una nueva solicitud de cuenta en avci.es:</p>
      <ul>
        <li><strong>Nombre:</strong> ${e(nombre)} ${e(apellidos)}</li>
        <li><strong>Empresa:</strong> ${e(empresa)}</li>
        <li><strong>CIF/NIF:</strong> ${e(cifNif)}</li>
        <li><strong>Tipo de profesional:</strong> ${e(tipoProfesional)}</li>
        <li><strong>Dirección:</strong> ${e(direccion)}</li>
        <li><strong>Email:</strong> ${e(email)}</li>
      </ul>
      <p><a href="https://avci.es/admin/solicitudes">Revisar solicitud</a></p>
    `,
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
