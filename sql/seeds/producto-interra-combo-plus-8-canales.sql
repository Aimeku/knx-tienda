-- ============================================================
-- Seed: Interra Combo+ Actuador KNX de 8 canales (ITR525-XXXX)
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
  'ITR525-XXXX-8',
  'Interra Combo+ Actuador KNX de 8 canales',
  'interra-combo-plus-actuador-knx-8-canales',
  'Actuador combinado KNX de 8 canales para control de iluminación, calefacción, persianas y Fan Coil. Configuración completa vía ETS, alimentación por bus KNX y control manual integrado en la propia unidad.',
  E'El Interra Combo+ de 8 canales es un actuador multifunción diseñado para instalaciones KNX que requieren flexibilidad y capacidad de control en entornos residenciales, hoteleros y comerciales. Cada salida puede configurarse individualmente desde ETS, permitiendo funciones independientes como iluminación, calefacción, persianas y control de Fan Coil.\n\nLa comunicación a través del bus KNX permite integrar el dispositivo con sensores KNX y sistemas BMS. En caso de fallo de comunicación, el actuador permite el control manual de cada salida mediante los pulsadores frontales.\n\nEl dispositivo se alimenta directamente del bus KNX, sin necesidad de fuente adicional, y admite hasta 600 direcciones de grupo y 600 asociaciones, según la parametrización en ETS (Product Code ITR525-XXXX).\n\nIncluye diversas funciones avanzadas como escenas, temporizaciones, lógica, bloqueo, forzado, contadores de horas de funcionamiento, monitorización periódica y memoria del último estado ante una interrupción eléctrica.',
  'Interra',
  0,
  0,
  true,
  null,
  '[
    {"titulo": "Número de canales", "valor": "8"},
    {"titulo": "Protocolo", "valor": "KNX TP"},
    {"titulo": "Alimentación", "valor": "KNX Bus (sin fuente externa)"},
    {"titulo": "Configuración", "valor": "ETS (objetos variables según parámetros)"},
    {"titulo": "Control manual", "valor": "Pulsadores frontales"},
    {"titulo": "Funciones por canal", "valor": [
      "Control de iluminación",
      "Control de calefacción",
      "Control de persianas/shutters (requiere 2 salidas consecutivas)",
      "Escenas y temporizaciones",
      "Lógica (logic gates)",
      "Bloqueo / forzado",
      "Telegramas de feedback configurables",
      "Contador de horas de funcionamiento"
    ]},
    {"titulo": "Fan Coil", "valor": [
      "2 tubos: requiere 4 salidas consecutivas del bloque",
      "4 tubos: requiere 5 salidas consecutivas del bloque"
    ]},
    {"titulo": "Capacidad", "valor": "600 GA / 600 asociaciones"},
    {"titulo": "Modelo ETS", "valor": "ITR525-XXXX"},
    {"titulo": "Montaje", "valor": "Carril DIN"}
  ]'::jsonb,
  '[
    {"titulo": "Protocolo", "valor": "KNX"},
    {"titulo": "Tipo de dispositivo", "valor": "Actuador"},
    {"titulo": "Serie / Modelo", "valor": "Combo +"},
    {"titulo": "Canales", "valor": "8"},
    {"titulo": "Montaje", "valor": "Carril DIN"},
    {"titulo": "HVAC / Clima", "valor": [
      "Calefacción (On/Off)",
      "Control de válvulas",
      "Fan Coil 2 tubos",
      "Fan Coil 4 tubos",
      "Refrigeración"
    ]},
    {"titulo": "Tipo de salida", "valor": "Relay"}
  ]'::jsonb
);
