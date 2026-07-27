# Tienda KNX

Tienda online a medida para catálogo de productos KNX.
Stack: Astro + Supabase + Stripe Checkout.

## Cómo funciona

- Las páginas de catálogo (`/productos`, `/productos/[slug]`) son **estáticas**:
  se generan en build time leyendo Supabase, así que cargan rápido y se indexan
  bien en Google.
- El carrito vive en `localStorage` del navegador (sin cuentas de usuario por ahora).
- `/api/checkout` y `/api/stripe-webhook` son los únicos endpoints que corren en
  servidor (Node), porque necesitan la clave secreta de Stripe.

## Puesta en marcha

1. Crea un proyecto en https://supabase.com
2. Ve a SQL Editor y ejecuta el contenido de `sql/schema.sql`
3. Copia `.env.example` a `.env` y rellena las claves de Supabase y Stripe
4. `npm install`
5. `npm run dev`

## Cargar productos

Por ahora los productos se cargan directamente en la tabla `productos` de
Supabase (desde el Table Editor de su panel, o con un script de importación
CSV si tienes ya un catálogo). El siguiente paso natural es construir un
panel de administración para hacerlo sin tocar Supabase a mano — dímelo
cuando quieras y lo montamos.

## Webhook de Stripe en local

Para probar pagos en local necesitas reenviar los eventos de Stripe:

```
stripe listen --forward-to localhost:4321/api/stripe-webhook
```

## Despliegue

Recomendado: Vercel (o cualquier hosting con soporte Node), conectando el
repo de GitHub. Recuerda configurar las mismas variables de entorno del
`.env` en el panel del hosting, y el webhook de Stripe apuntando a tu
dominio real una vez publicada.
