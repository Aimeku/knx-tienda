export const prerender = false; // este endpoint necesita ejecutarse en servidor

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../lib/supabase';
import { createServerSupabase } from '../../lib/supabase-server';
import { conIva } from '../../lib/tienda';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const POST: APIRoute = async ({ request, cookies }) => {
  // Comprar también requiere cuenta aprobada, igual que ver los precios.
  const supabase = createServerSupabase(request, cookies);
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) {
    return new Response(JSON.stringify({ error: 'Debes iniciar sesión para comprar.' }), { status: 401 });
  }
  const { data: perfil } = await supabaseAdmin.from('perfiles').select('estado').eq('id', sesion.user.id).single();
  if (perfil?.estado !== 'aprobado') {
    return new Response(JSON.stringify({ error: 'Tu cuenta todavía no ha sido aprobada.' }), { status: 403 });
  }

  const { items } = await request.json().catch(() => ({ items: null }));
  // El pedido va siempre al email de la cuenta con la que se ha iniciado sesión.
  const email = sesion.user.email!;

  if (!Array.isArray(items) || !items.length || items.length > 200) {
    return new Response(JSON.stringify({ error: 'Carrito vacío' }), { status: 400 });
  }

  // El precio NUNCA se coge de lo que manda el navegador: se recalcula aquí
  // a partir de Supabase, para que nadie pueda manipular lo que paga.
  const lineasResueltas: Array<{ productoId: string; varianteId: string | null; nombre: string; precio: number; cantidad: number }> = [];

  for (const item of items) {
    const cantidad = Math.min(9999, Math.max(1, Math.floor(Number(item?.cantidad) || 1)));
    const productoId = String(item?.productoId ?? '');

    const { data: producto } = await supabaseAdmin
      .from('productos')
      .select('id, nombre, precio, precio_oferta, activo')
      .eq('id', productoId)
      .single();

    if (!producto || !producto.activo) {
      return new Response(JSON.stringify({ error: 'Uno de los productos ya no está disponible.' }), { status: 400 });
    }

    let nombre = producto.nombre;
    // En Supabase el precio está sin IVA: se cobra con el IVA incluido.
    const base = Number(producto.precio_oferta ?? producto.precio);
    if (!(base > 0)) {
      return new Response(JSON.stringify({ error: `«${producto.nombre}» no tiene precio: solicita presupuesto.` }), { status: 400 });
    }
    let precio = conIva(base);
    let varianteId: string | null = null;

    if (item?.varianteId) {
      const { data: variante } = await supabaseAdmin
        .from('producto_variantes')
        .select('id, nombre, precio_extra, producto_id')
        .eq('id', item.varianteId)
        .single();

      if (!variante || variante.producto_id !== productoId) {
        return new Response(JSON.stringify({ error: 'Variante de producto inválida.' }), { status: 400 });
      }

      nombre = `${producto.nombre} – ${variante.nombre}`;
      precio += conIva(Number(variante.precio_extra) || 0);
      varianteId = variante.id;
    }

    lineasResueltas.push({ productoId, varianteId, nombre, precio, cantidad });
  }

  // Total con IVA y sin descuento; si el cliente usa un código de descuento en
  // Stripe, el webhook lo sustituye por el importe realmente cobrado.
  const total = Math.round(lineasResueltas.reduce((sum, i) => sum + i.precio * i.cantidad, 0) * 100) / 100;

  // 1. Creamos el pedido en Supabase en estado "pendiente"
  const { data: pedido, error } = await supabaseAdmin
    .from('pedidos')
    .insert({ cliente_email: email, total, estado: 'pendiente' })
    .select()
    .single();

  if (error || !pedido) {
    return new Response(JSON.stringify({ error: 'No se pudo crear el pedido' }), { status: 500 });
  }

  await supabaseAdmin.from('pedido_items').insert(
    lineasResueltas.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.productoId,
      variante_id: i.varianteId,
      nombre_producto: i.nombre,
      cantidad: i.cantidad,
      precio_unitario: i.precio,
    }))
  );

  // 2. Creamos la sesión de Stripe Checkout con los precios recalculados en servidor
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    locale: 'es',
    // Campo "Añadir código promocional" en la página de pago. Los códigos se
    // crean en el panel de Stripe (Catálogo de productos > Cupones).
    allow_promotion_codes: true,
    shipping_address_collection: { allowed_countries: ['ES'] },
    phone_number_collection: { enabled: true },
    line_items: lineasResueltas.map((i) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: i.nombre, description: 'IVA incluido' },
        unit_amount: Math.round(i.precio * 100),
      },
      quantity: i.cantidad,
    })),
    success_url: `${new URL(request.url).origin}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${new URL(request.url).origin}/carrito`,
    metadata: { pedido_id: pedido.id },
  });

  // 3. Guardamos el id de sesión de Stripe en el pedido
  await supabaseAdmin.from('pedidos').update({ stripe_session_id: session.id }).eq('id', pedido.id);

  return new Response(JSON.stringify({ url: session.url }), { status: 200 });
};
