// Cálculo de un pedido en servidor: precios desde Supabase (nunca los que
// manda el navegador), IVA y código de descuento.
import { supabaseAdmin } from './supabase';
import { conIva, gastosEnvio } from './tienda';

export type LineaPedido = {
  productoId: string;
  varianteId: string | null;
  nombre: string;
  sku: string | null;
  precio: number; // unitario con IVA
  cantidad: number;
};

export type CodigoDescuento = {
  codigo: string;
  tipo: 'porcentaje' | 'importe';
  valor: number;
  minimo: number;
  usos_max: number | null;
  usos: number;
  caduca: string | null;
  activo: boolean;
};

export type ResultadoPedido =
  | { ok: true; lineas: LineaPedido[]; subtotal: number; descuento: number; envio: number; total: number; codigo: string | null; avisoCodigo: string | null }
  | { ok: false; error: string };

const redondear = (n: number) => Math.round(n * 100) / 100;

export const normalizarCodigo = (codigo: unknown) =>
  String(codigo ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40);

export async function calcularPedido(items: unknown, codigoBruto: unknown): Promise<ResultadoPedido> {
  if (!Array.isArray(items) || items.length === 0) return { ok: false, error: 'Tu carrito está vacío.' };
  if (items.length > 200) return { ok: false, error: 'Demasiadas líneas en el carrito.' };

  const lineas: LineaPedido[] = [];
  for (const item of items) {
    const cantidad = Math.min(9999, Math.max(1, Math.floor(Number(item?.cantidad) || 1)));
    const productoId = String(item?.productoId ?? '');

    const { data: producto } = await supabaseAdmin
      .from('productos')
      .select('id, nombre, sku, precio, precio_oferta, activo')
      .eq('id', productoId)
      .maybeSingle();
    if (!producto || !producto.activo) return { ok: false, error: 'Uno de los productos ya no está disponible.' };

    const base = Number(producto.precio_oferta ?? producto.precio);
    if (!(base > 0)) return { ok: false, error: `«${producto.nombre}» no tiene precio: solicita presupuesto.` };

    let nombre = producto.nombre as string;
    let precio = conIva(base);
    let varianteId: string | null = null;
    if (item?.varianteId) {
      const { data: variante } = await supabaseAdmin
        .from('producto_variantes')
        .select('id, nombre, precio_extra, producto_id')
        .eq('id', item.varianteId)
        .maybeSingle();
      if (!variante || variante.producto_id !== productoId) return { ok: false, error: 'Variante de producto inválida.' };
      nombre = `${producto.nombre} – ${variante.nombre}`;
      precio = redondear(precio + conIva(Number(variante.precio_extra) || 0));
      varianteId = variante.id;
    }

    // Si el mismo producto viene dos veces, se juntan las cantidades.
    const repetida = lineas.find((l) => l.productoId === productoId && l.varianteId === varianteId);
    if (repetida) repetida.cantidad = Math.min(9999, repetida.cantidad + cantidad);
    else lineas.push({ productoId, varianteId, nombre, sku: producto.sku ?? null, precio, cantidad });
  }

  const subtotal = redondear(lineas.reduce((s, l) => s + l.precio * l.cantidad, 0));

  let descuento = 0;
  let codigo: string | null = null;
  let avisoCodigo: string | null = null;
  const pedido = normalizarCodigo(codigoBruto);
  if (pedido) {
    const { data } = await supabaseAdmin.from('codigos_descuento').select('*').eq('codigo', pedido).maybeSingle<CodigoDescuento>();
    if (!data || !data.activo) avisoCodigo = 'Ese código de descuento no existe.';
    else if (data.caduca && new Date(data.caduca) < new Date()) avisoCodigo = 'Ese código de descuento ha caducado.';
    else if (data.usos_max != null && data.usos >= data.usos_max) avisoCodigo = 'Ese código de descuento ya se ha agotado.';
    else if (subtotal < Number(data.minimo)) avisoCodigo = `Ese código es para pedidos a partir de ${Number(data.minimo).toFixed(2).replace('.', ',')} €.`;
    else {
      codigo = data.codigo;
      descuento = data.tipo === 'porcentaje' ? (subtotal * Number(data.valor)) / 100 : Number(data.valor);
      descuento = redondear(Math.min(descuento, subtotal));
    }
  }

  const envio = gastosEnvio(redondear(subtotal - descuento));
  return { ok: true, lineas, subtotal, descuento, envio, total: redondear(subtotal - descuento + envio), codigo, avisoCodigo };
}

// Datos para la transferencia (variables de entorno de Vercel).
export function datosTransferencia() {
  return {
    iban: (import.meta.env.TRANSFERENCIA_IBAN as string | undefined) ?? '',
    titular: (import.meta.env.TRANSFERENCIA_TITULAR as string | undefined) ?? 'AVCI',
    banco: (import.meta.env.TRANSFERENCIA_BANCO as string | undefined) ?? '',
  };
}

export const referenciaPedido = (numero: number | string) => `AVCI-${String(numero).padStart(5, '0')}`;

export const escaparHtml = (t: unknown) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
