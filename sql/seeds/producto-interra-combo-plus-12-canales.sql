-- ============================================================
-- Seed: Interra Combo+ Actuador KNX de 12 canales (ITR525-XXXX)
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
  'ITR525-XXXX-12',
  'Interra Combo+ Actuador KNX de 12 canales',
  'interra-combo-plus-actuador-knx-12-canales',
  'Actuador combinado KNX de 12 canales, configurable mediante ETS para control de iluminación, calefacción, persianas y sistemas Fan Coil. Alimentación por bus KNX y control manual integrado en el dispositivo.',
  E'El Interra Combo+ de 12 canales es un actuador multifunción diseñado para proyectos KNX donde se requiere un alto número de salidas y una gran flexibilidad de configuración. Cada canal puede parametrizarse desde ETS, permitiendo funciones independientes de iluminación, calefacción, persianas y control de Fan Coil.\n\nEl dispositivo se comunica mediante el bus KNX, asegurando compatibilidad con sensores KNX, otros actuadores y sistemas de gestión de edificios (BMS). En situaciones de fallo de comunicación, el actuador permite control manual de cada salida mediante pulsadores frontales.\n\nEl Combo+ se alimenta directamente del bus KNX, sin fuente adicional, y soporta hasta 600 direcciones de grupo y 600 asociaciones, según la configuración (Product Code ITR525-XXXX).\n\nIncluye funciones avanzadas como escenas, temporizaciones, puertas lógicas, bloqueo, forzado, contadores de horas de funcionamiento y memoria del último estado ante fallo eléctrico, garantizando un funcionamiento estable en entornos residenciales, hoteleros y comerciales.',
  'Interra',
  0,
  0,
  true,
  null,
  '[
    {"titulo": "Número de canales", "valor": "12"},
    {"titulo": "Protocolo", "valor": "KNX TP"},
    {"titulo": "Alimentación", "valor": "KNX Bus (sin fuente externa)"},
    {"titulo": "Configuración", "valor": "ETS (objetos variables según la parametrización)"},
    {"titulo": "Control manual", "valor": "Pulsadores frontales"},
    {"titulo": "Funciones por canal", "valor": [
      "Control de iluminación",
      "Control de calefacción",
      "Control de persianas/shutters (requiere 2 salidas consecutivas)",
      "Escenas y temporizaciones",
      "Lógica (logic gates)",
      "Bloqueo / Forzado",
      "Feedback configurable",
      "Contador de horas de funcionamiento"
    ]},
    {"titulo": "Control Fan Coil", "valor": [
      "2 tubos: requiere 4 salidas del mismo bloque",
      "4 tubos: requiere 5 salidas del mismo bloque"
    ]},
    {"titulo": "Capacidad", "valor": "600 direcciones de grupo / 600 asociaciones"},
    {"titulo": "Modelo ETS", "valor": "ITR525-XXXX"},
    {"titulo": "Montaje", "valor": "Carril DIN"},
    {"titulo": "Bloques posibles (6 salidas por bloque)", "valor": [
      "A1–A6",
      "B7–B12",
      "C13–C18",
      "D19–D24",
      "12 canales = bloques A y B completos"
    ]}
  ]'::jsonb,
  '[
    {"titulo": "Protocolo", "valor": "KNX"},
    {"titulo": "Tipo de dispositivo", "valor": "Actuador"},
    {"titulo": "Serie / Modelo", "valor": "Combo +"},
    {"titulo": "Canales", "valor": "12"},
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
