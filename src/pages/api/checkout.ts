export const prerender = false; // este endpoint necesita ejecutarse en servidor

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const POST: APIRoute = async ({ request }) => {
  const { items, email } = await request.json();

  if (!items?.length) {
    return new Response(JSON.stringify({ error: 'Carrito vacío' }), { status: 400 });
  }

  const total = items.reduce((sum: number, i: any) => sum + i.precio * i.cantidad, 0);

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
    items.map((i: any) => ({
      pedido_id: pedido.id,
      producto_id: i.id,
      nombre_producto: i.nombre,
      cantidad: i.cantidad,
      precio_unitario: i.precio,
    }))
  );

  // 2. Creamos la sesión de Stripe Checkout
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: items.map((i: any) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: i.nombre },
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
