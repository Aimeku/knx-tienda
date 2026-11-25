export const prerender = false;

// Pedidos con pago por transferencia bancaria.
//   POST { accion: 'calcular', items, codigo }  -> resumen (subtotal, descuento, total)
//   POST { accion: 'confirmar', items, codigo, telefono, direccion, notas } -> crea el pedido
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { createServerSupabase } from '../../lib/supabase-server';
import { calcularPedido, datosTransferencia, referenciaPedido, escaparHtml as e } from '../../lib/pedidos';
import { formatoPrecio } from '../../lib/tienda';
import { enviarEmail } from '../../lib/email';

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

const texto = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export const POST: APIRoute = async ({ request, cookies }) => {
  // Comprar requiere cuenta aprobada, igual que ver los precios.
  const supabase = createServerSupabase(request, cookies);
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) return json({ error: 'Debes iniciar sesión para comprar.' }, 401);
  const { data: perfil } = await supabaseAdmin
    .from('perfiles')
    .select('estado, nombre, apellidos, empresa, cif_nif, email')
    .eq('id', sesion.user.id)
    .single();
  if (perfil?.estado !== 'aprobado') return json({ error: 'Tu cuenta todavía no ha sido aprobada.' }, 403);

  const cuerpo = await request.json().catch(() => ({}));
  const calculo = await calcularPedido(cuerpo.items, cuerpo.codigo);
  if (!calculo.ok) return json({ error: calculo.error }, 400);

  const resumen = {
    lineas: calculo.lineas.map((l) => ({ nombre: l.nombre, sku: l.sku, precio: l.precio, cantidad: l.cantidad })),
    subtotal: calculo.subtotal,
    descuento: calculo.descuento,
    total: calculo.total,
    codigo: calculo.codigo,
    avisoCodigo: calculo.avisoCodigo,
  };
  if (cuerpo.accion !== 'confirmar') return json(resumen);

  // --- Confirmar pedido ---
  if (calculo.avisoCodigo) return json({ error: calculo.avisoCodigo }, 400);
  const direccion = texto(cuerpo.direccion, 400);
  const telefono = texto(cuerpo.telefono, 30);
  const notas = texto(cuerpo.notas, 1000);
  if (direccion.length < 10) return json({ error: 'Indica la dirección de envío completa.' }, 400);
  if (!/^[+\d][\d\s-]{6,}$/.test(telefono)) return json({ error: 'Indica un teléfono de contacto válido.' }, 400);

  if (calculo.codigo) {
    const { data: usado } = await supabaseAdmin.rpc('usar_codigo_descuento', { p_codigo: calculo.codigo });
    if (!usado) return json({ error: 'Ese código de descuento ya no es válido.' }, 400);
  }

  const email = sesion.user.email ?? perfil.email;
  const nombre = `${perfil.nombre} ${perfil.apellidos}`.trim();
  const { data: pedido, error } = await supabaseAdmin
    .from('pedidos')
    .insert({
      usuario_id: sesion.user.id,
      cliente_email: email,
      cliente_nombre: nombre,
      direccion_envio: { direccion, empresa: perfil.empresa, cif_nif: perfil.cif_nif },
      telefono,
      notas: notas || null,
      metodo_pago: 'transferencia',
      estado: 'pendiente',
      subtotal: calculo.subtotal,
      descuento: calculo.descuento,
      codigo_descuento: calculo.codigo,
      total: calculo.total,
    })
    .select('id, numero')
    .single();
  if (error || !pedido) {
    console.error('[pedido] No se pudo crear:', error);
    return json({ error: 'No se pudo crear el pedido. Inténtalo de nuevo o escríbenos a info@avci.es.' }, 500);
  }

  const { error: errorLineas } = await supabaseAdmin.from('pedido_items').insert(
    calculo.lineas.map((l) => ({
      pedido_id: pedido.id,
      producto_id: l.productoId,
      variante_id: l.varianteId,
      nombre_producto: l.sku ? `${l.nombre} (Ref. ${l.sku})` : l.nombre,
      cantidad: l.cantidad,
      precio_unitario: l.precio,
    }))
  );
  if (errorLineas) console.error('[pedido] Error guardando líneas:', errorLineas);

  // Emails: al cliente (con los datos para transferir) y a la tienda.
  const ref = referenciaPedido(pedido.numero);
  const banco = datosTransferencia();
  const tabla = `
    <table cellpadding="6" style="border-collapse:collapse">
      ${calculo.lineas.map((l) => `<tr><td>${e(l.nombre)}${l.sku ? ` <small>(Ref. ${e(l.sku)})</small>` : ''}</td><td>x${l.cantidad}</td><td align="right">${formatoPrecio(l.precio * l.cantidad)}</td></tr>`).join('')}
      ${calculo.descuento ? `<tr><td colspan="2">Descuento (${e(calculo.codigo)})</td><td align="right">-${formatoPrecio(calculo.descuento)}</td></tr>` : ''}
      <tr><td colspan="2"><strong>Total (IVA incluido)</strong></td><td align="right"><strong>${formatoPrecio(calculo.total)}</strong></td></tr>
    </table>`;
  const datosPago = `
    <p><strong>Importe:</strong> ${formatoPrecio(calculo.total)}<br>
    <strong>IBAN:</strong> ${e(banco.iban || '(te lo enviaremos en breve)')}<br>
    <strong>Titular:</strong> ${e(banco.titular)}${banco.banco ? `<br><strong>Banco:</strong> ${e(banco.banco)}` : ''}<br>
    <strong>Concepto:</strong> ${ref}</p>`;

  await Promise.all([
    enviarEmail({
      to: email,
      subject: `Pedido ${ref} recibido – pendiente de transferencia`,
      html: `<p>Hola ${e(perfil.nombre)},</p>
        <p>Hemos recibido tu pedido <strong>${ref}</strong>. Para completarlo, haz una transferencia con estos datos:</p>
        ${datosPago}
        <p>Prepararemos el envío en cuanto recibamos el pago.</p>
        ${tabla}
        <p><strong>Envío a:</strong> ${e(direccion)}</p>
        <p>Gracias,<br>AVCI Smart Homes</p>`,
    }),
    enviarEmail({
      to: 'info@avci.es',
      subject: `Nuevo pedido ${ref} – ${formatoPrecio(calculo.total)} (transferencia)`,
      html: `<p><strong>${e(nombre)}</strong> · ${e(perfil.empresa)} · ${e(perfil.cif_nif)}<br>
        ${e(email)} · ${e(telefono)}</p>
        <p><strong>Envío:</strong> ${e(direccion)}</p>
        ${notas ? `<p><strong>Notas:</strong> ${e(notas)}</p>` : ''}
        ${tabla}
        <p>Cuando llegue la transferencia, cambia el estado del pedido a «pagado» en Supabase (tabla pedidos, número ${pedido.numero}).</p>`,
    }),
  ]);

  return json({ ok: true, id: pedido.id, referencia: ref });
};
