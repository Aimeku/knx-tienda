export const prerender = false;

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response('Firma inválida', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const pedidoId = session.metadata?.pedido_id;

    if (pedidoId && session.payment_status === 'paid') {
      // Importe realmente cobrado (ya con el código de descuento, si lo hubo),
      // nombre y dirección de envío que el cliente ha puesto en Stripe.
      const envio = session.collected_information?.shipping_details ?? null;
      await supabaseAdmin
        .from('pedidos')
        .update({
          estado: 'pagado',
          ...(session.amount_total != null && { total: session.amount_total / 100 }),
          cliente_nombre: envio?.name ?? session.customer_details?.name ?? null,
          direccion_envio: envio
            ? { ...envio, telefono: session.customer_details?.phone ?? null, descuento: (session.total_details?.amount_discount ?? 0) / 100 }
            : null,
        })
        .eq('id', pedidoId);
      // Aquí también puedes descontar stock, enviar email de confirmación, etc.
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
