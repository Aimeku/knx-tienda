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
  | { ok: true; lineas: LineaPedido[]; subtotal: number; descuento: number; envio: number; total: number; codigo: string | null; avisoCodigo: string | null; porcentaje: number | null; codigoEsDeCuenta: boolean }
  | { ok: false; error: string };

const redondear = (n: number) => Math.round(n * 100) / 100;

export const normalizarCodigo = (codigo: unknown) =>
  String(codigo ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40);

// Motivo por el que un código no se puede usar ahora (sin mirar el mínimo), o null si vale.
function codigoNoValido(c: CodigoDescuento | null): string | null {
  if (!c || !c.activo) return 'Ese código de descuento no existe.';
  if (c.caduca && new Date(c.caduca) < new Date()) return 'Ese código de descuento ha caducado.';
  if (c.usos_max != null && c.usos >= c.usos_max) return 'Ese código de descuento ya se ha agotado.';
  return null;
}

// Descuento asignado a la cuenta (solo códigos de porcentaje y válidos).
export type DescuentoCuenta = { codigo: string; porcentaje: number };
export async function descuentoDeCuenta(codigoPerfil: string | null | undefined): Promise<DescuentoCuenta | null> {
  if (!codigoPerfil) return null;
  const { data } = await supabaseAdmin.from('codigos_descuento').select('*').eq('codigo', codigoPerfil).maybeSingle<CodigoDescuento>();
  if (!data || data.tipo !== 'porcentaje' || codigoNoValido(data)) return null;
  return { codigo: data.codigo, porcentaje: Number(data.valor) };
}

// Precio con el porcentaje de descuento aplicado (redondeado a céntimos).
export const conDescuento = (precio: number, porcentaje: number) => redondear(precio * (1 - porcentaje / 100));

export async function calcularPedido(items: unknown, codigoBruto: unknown, codigoCuenta?: string | null): Promise<ResultadoPedido> {
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
  let porcentaje: number | null = null;
  // El código que escribe el cliente; si no escribe ninguno, el de su cuenta.
  const escrito = normalizarCodigo(codigoBruto);
  const pedido = escrito || normalizarCodigo(codigoCuenta);
  const codigoEsDeCuenta = !escrito && Boolean(pedido);
  if (pedido) {
    const { data } = await supabaseAdmin.from('codigos_descuento').select('*').eq('codigo', pedido).maybeSingle<CodigoDescuento>();
    const motivo = codigoNoValido(data);
    if (motivo || !data) {
      // Si el de la cuenta ya no vale, se compra sin descuento y sin avisos.
      if (!codigoEsDeCuenta) avisoCodigo = motivo;
    } else if (subtotal < Number(data.minimo)) {
      avisoCodigo = `El código ${data.codigo} es para pedidos a partir de ${Number(data.minimo).toFixed(2).replace('.', ',')} €.`;
    } else {
      codigo = data.codigo;
      if (data.tipo === 'porcentaje') {
        // Línea a línea, para que cuadre con los precios en rojo que ve el cliente.
        porcentaje = Number(data.valor);
        descuento = lineas.reduce((s, l) => s + (l.precio - conDescuento(l.precio, porcentaje!)) * l.cantidad, 0);
      } else {
        descuento = Number(data.valor);
      }
      descuento = redondear(Math.min(descuento, subtotal));
    }
  }

  const envio = gastosEnvio(redondear(subtotal - descuento));
  return { ok: true, lineas, subtotal, descuento, envio, total: redondear(subtotal - descuento + envio), codigo, avisoCodigo, porcentaje, codigoEsDeCuenta };
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
