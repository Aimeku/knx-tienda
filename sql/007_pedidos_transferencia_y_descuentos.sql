-- ============================================================
-- Migración: pedidos por transferencia bancaria y códigos de descuento
-- Ejecutar en el SQL Editor de Supabase (se puede ejecutar más de una vez).
-- No cambia ninguna policy existente: las tablas nuevas tienen RLS activado
-- y sin policies, así que solo el backend (service role) puede leerlas.
-- ============================================================

-- 1. Pedidos: número legible (para el concepto de la transferencia) y
--    desglose del importe.
alter table pedidos add column if not exists numero bigint generated always as identity;
alter table pedidos add column if not exists metodo_pago text not null default 'transferencia';
alter table pedidos add column if not exists subtotal numeric(10,2);        -- con IVA, antes del descuento
alter table pedidos add column if not exists descuento numeric(10,2) not null default 0;
alter table pedidos add column if not exists codigo_descuento text;
alter table pedidos add column if not exists telefono text;
alter table pedidos add column if not exists notas text;
alter table pedidos add column if not exists usuario_id uuid references auth.users(id);
create unique index if not exists pedidos_numero_idx on pedidos (numero);

-- 2. Códigos de descuento.
--    tipo 'porcentaje': valor = % (10 = 10 %).  tipo 'importe': valor = € (IVA incluido).
create table if not exists codigos_descuento (
  codigo text primary key,                         -- se guarda en MAYÚSCULAS
  tipo text not null check (tipo in ('porcentaje', 'importe')),
  valor numeric(10,2) not null check (valor > 0),
  minimo numeric(10,2) not null default 0,         -- importe mínimo del pedido (IVA incl.)
  usos_max int,                                    -- null = sin límite
  usos int not null default 0,
  caduca timestamptz,                              -- null = no caduca
  activo boolean not null default true,
  descripcion text,
  created_at timestamptz default now(),
  check (tipo <> 'porcentaje' or valor <= 100)
);
alter table codigos_descuento enable row level security;

-- Suma un uso solo si el código sigue siendo válido (evita pasarse del
-- límite aunque dos clientes lo usen a la vez). Devuelve true si lo ha usado.
create or replace function usar_codigo_descuento(p_codigo text)
returns boolean
language sql
security definer
set search_path = public
as $$
  with usado as (
    update codigos_descuento
       set usos = usos + 1
     where codigo = upper(p_codigo)
       and activo
       and (caduca is null or caduca > now())
       and (usos_max is null or usos < usos_max)
    returning 1
  )
  select exists (select 1 from usado);
$$;
revoke all on function usar_codigo_descuento(text) from public, anon, authenticated;

-- Ejemplo (bórralo o cámbialo): 10 % de descuento, 100 usos, hasta fin de año.
-- insert into codigos_descuento (codigo, tipo, valor, usos_max, caduca, descripcion)
-- values ('BIENVENIDA10', 'porcentaje', 10, 100, '2026-12-31 23:59', 'Lanzamiento tienda');
