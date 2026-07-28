-- ============================================================
-- Seed: Interra Combo+ Actuador KNX de 16 canales (ITR525-XXXX)
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
  'ITR525-XXXX-16',
  'Interra Combo+ – Actuador KNX de 16 canales',
  'interra-combo-plus-actuador-knx-16-canales',
  'Actuador combinado KNX de 16 canales, configurable por ETS para control de iluminación, calefacción, persianas y sistemas Fan Coil. Alimentación por bus KNX y control manual integrado en el dispositivo.',
  E'El Interra Combo+ de 16 canales es un actuador multifunción de alta capacidad diseñado para instalaciones KNX que requieren un número elevado de salidas y una configuración flexible. Cada canal puede parametrizarse desde ETS, permitiendo funciones independientes de iluminación, calefacción, persianas y control de Fan Coil.\n\nSu comunicación mediante bus KNX permite intercambiar información con sensores KNX y sistemas de gestión de edificios (BMS). En caso de fallo de comunicación, el actuador permite el control manual de cada salida gracias a sus pulsadores frontales.\n\nEl actuador se alimenta directamente del bus KNX, sin necesidad de fuente adicional. La gama Combo+ admite hasta 600 direcciones de grupo y 600 asociaciones, dependiendo de la configuración realizada en ETS (Product Code ITR525-XXXX).\n\nIncluye funciones avanzadas como escenas, temporizaciones, puertas lógicas, bloqueo, forzado, contadores de horas de funcionamiento, monitorización periódica y memoria del último estado ante fallo eléctrico. La serie está orientada a proyectos residenciales, hoteleros y comerciales de alta exigencia.',
  'Interra',
  0,
  0,
  true,
  null,
  '[
    {"titulo": "Número de canales", "valor": "16"},
    {"titulo": "Protocolo", "valor": "KNX TP"},
    {"titulo": "Alimentación", "valor": "KNX Bus (sin fuente externa)"},
    {"titulo": "Configuración", "valor": "ETS (objetos según parametrización)"},
    {"titulo": "Control manual", "valor": "Pulsadores frontales en la propia unidad"},
    {"titulo": "Funciones por canal", "valor": [
      "Control de iluminación",
      "Control de calefacción",
      "Control de persianas/shutters (requiere 2 salidas consecutivas)",
      "Escenas y temporizaciones",
      "Lógica (logic gates)",
      "Funciones de bloqueo y forzado",
      "Feedback configurable",
      "Contador de horas de funcionamiento"
    ]},
    {"titulo": "Control Fan Coil", "valor": [
      "2 tubos: requiere 4 salidas consecutivas del mismo bloque",
      "4 tubos: requiere 5 salidas consecutivas del mismo bloque"
    ]},
    {"titulo": "Capacidad", "valor": "600 GA / 600 asociaciones"},
    {"titulo": "Modelo ETS", "valor": "ITR525-XXXX"},
    {"titulo": "Montaje", "valor": "Carril DIN"},
    {"titulo": "Bloques disponibles (6 salidas por bloque)", "valor": [
      "A1–A6",
      "B7–B12",
      "C13–C18",
      "D19–D24",
      "16 canales = bloques A, B y C completos"
    ]}
  ]'::jsonb,
  '[
    {"titulo": "Protocolo", "valor": "KNX"},
    {"titulo": "Tipo de dispositivo", "valor": "Actuador"},
    {"titulo": "Serie / Modelo", "valor": "Combo +"},
    {"titulo": "Canales", "valor": "16"},
    {"titulo": "Conectividad", "valor": "KNX Bus"},
    {"titulo": "Funciones principales", "valor": [
      "Control de clima",
      "Control de iluminación",
      "Control de persianas / shutters",
      "Control Fan Coil",
      "Escenas",
      "Lógica (logic functions)",
      "Programación horaria"
    ]},
    {"titulo": "HVAC / Clima", "valor": [
      "Calefacción (On/Off)",
      "Fan Coil 2 tubos",
      "Fan Coil 4 tubos",
      "Refrigeración"
    ]},
    {"titulo": "Tipo de salida", "valor": "Relay"}
  ]'::jsonb
);
