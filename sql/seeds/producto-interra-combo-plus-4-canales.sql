-- ============================================================
-- Seed: Interra KNX Combo+ Switch Actuator 4 Canales (ITR525-XXXX)
-- Ejecutar en el SQL Editor de Supabase después de:
--   sql/schema.sql, 002_..., 003_..., 004_...
--
-- precio = 0 e imagen_principal = NULL a propósito, edítalos a mano
-- cuando tengas el precio real y la foto subida a Storage. El SKU es
-- un placeholder (el manual solo da el código base ITR525-XXXX).
-- ============================================================

insert into categorias (nombre, slug)
values ('Actuadores', 'actuadores')
on conflict (slug) do nothing;

insert into productos (
  categoria_id,
  sku,
  nombre,
  slug,
  descripcion_corta,
  descripcion_larga,
  marca,
  precio,
  stock,
  activo,
  imagen_principal,
  especificaciones,
  info_adicional
)
values (
  (select id from categorias where slug = 'actuadores'),
  'ITR525-XXXX-4',
  'Interra KNX Combo+ Switch Actuator 4 Canales',
  'interra-knx-combo-plus-switch-actuator-4-canales',
  'Actuador multifunción KNX de 4 canales para control de iluminación, climatización o persianas. Alimentado directamente desde el bus KNX, permite configuración completa mediante ETS y control manual en caso de fallo de comunicación.',
  E'El Interra KNX Combo+ Switch Actuator – 4 Canales es un actuador multifuncional diseñado para ofrecer la máxima flexibilidad en sistemas de automatización KNX en edificios residenciales y hoteleros. Cada salida puede configurarse de forma independiente para el control de iluminación, calefacción o cortinas/persianas, adaptándose a distintos escenarios de instalación.\n\nLa comunicación con el bus KNX permite la integración directa con sensores y sistemas de gestión de edificios (BMS), garantizando una operación segura y eficiente. El dispositivo dispone de pulsadores frontales que permiten el control manual de las salidas, especialmente útil en caso de fallo de comunicación del bus. El Combo+ se alimenta directamente desde el bus KNX, sin necesidad de fuente de alimentación externa, y su configuración completa se realiza mediante ETS.\n\nEl dispositivo admite funciones avanzadas por canal, como temporizaciones, puertas lógicas, escenas, funciones forzadas, contadores de horas de funcionamiento y supervisión periódica, además de opciones configurables para telegramas de feedback.\n\nSu memoria de último estado asegura la continuidad de funcionamiento tras una interrupción eléctrica. Soporta hasta 600 direcciones de grupo y 600 asignaciones, ofreciendo una solución versátil y escalable para aplicaciones de control en domótica KNX.',
  'Interra',
  0,
  0,
  true,
  null,
  '[
    {"titulo": "Referencia / Código de producto", "valor": "ITR525-XXXX"},
    {"titulo": "Número de canales", "valor": "4"},
    {"titulo": "Protocolo de comunicación", "valor": "KNX TP"},
    {"titulo": "Alimentación", "valor": "Desde el bus KNX (sin fuente externa)"},
    {"titulo": "Configuración", "valor": "A través de ETS"},
    {"titulo": "Funciones por salida", "valor": [
      "Control de iluminación",
      "Control de calefacción",
      "Control de persianas / estores (requiere 2 salidas consecutivas)",
      "Configuración de Fan Coil (2 o 4 tubos, según bloque)",
      "Funciones lógicas integradas: temporizadores, compuertas lógicas, escenas, forzado, contador de horas, supervisión periódica"
    ]},
    {"titulo": "Memoria de último estado", "valor": "Sí"},
    {"titulo": "Capacidad de direccionamiento", "valor": "Hasta 600 direcciones de grupo / 600 asignaciones"},
    {"titulo": "Control manual", "valor": "Mediante pulsadores en el dispositivo"},
    {"titulo": "Montaje", "valor": "En carril DIN"},
    {"titulo": "Bloques funcionales", "valor": "Cada bloque consta de 6 salidas consecutivas (A1–A6, B7–B12, C13–C18, D19–D24)"},
    {"titulo": "Aplicación típica", "valor": "Control general en viviendas, oficinas y hoteles"}
  ]'::jsonb,
  '[
    {"titulo": "Protocolo", "valor": "KNX"},
    {"titulo": "Tipo de dispositivo", "valor": "Actuador"},
    {"titulo": "Canales", "valor": "4"},
    {"titulo": "Montaje", "valor": "Carril DIN"},
    {"titulo": "Funciones principales", "valor": [
      "Control de clima",
      "Control de iluminación",
      "Control de persianas / shutters",
      "Control Fan Coil",
      "Escenas",
      "Lógica (logic functions)"
    ]},
    {"titulo": "Serie / Modelo", "valor": "Combo +"},
    {"titulo": "Tipo de salida", "valor": "Relay"}
  ]'::jsonb
);
