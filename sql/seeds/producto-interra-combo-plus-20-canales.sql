-- ============================================================
-- Seed: Interra Combo+ Actuador KNX de 20 canales (ITR525-XXXX)
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
  'ITR525-XXXX-20',
  'Interra Combo+ Actuador KNX de 20 canales',
  'interra-combo-plus-actuador-knx-20-canales',
  'Actuador combinado KNX de 20 canales, configurable mediante ETS para control de iluminación, calefacción, persianas y sistemas Fan Coil. Alimentación por bus KNX y control manual independiente en cada salida.',
  E'El Interra Combo+ de 20 canales es un actuador multifunción de alta capacidad diseñado para instalaciones KNX que requieren un gran número de salidas configurables. Cada canal puede parametrizarse mediante ETS, permitiendo funciones independientes de iluminación, calefacción, control de persianas y operación de sistemas Fan Coil.\n\nGracias a su comunicación mediante bus KNX, el dispositivo puede interoperar con sensores KNX, otros actuadores y sistemas de gestión de edificios (BMS). En caso de fallo de comunicación, el actuador permite el control manual de cada salida mediante pulsadores físicos integrados.\n\nEl actuador se alimenta directamente desde el bus KNX, sin necesidad de fuente externa. La gama Combo+ ofrece hasta 600 direcciones de grupo y 600 asociaciones, según la configuración (Product Code ITR525-XXXX).\n\nAdemás, incorpora funciones avanzadas como escenas, temporizaciones, lógica, bloqueo, forzado, contadores de horas de funcionamiento, monitorización periódica y memoria del último estado ante cortes eléctricos. Su diseño está orientado a instalaciones residenciales, hoteleras y comerciales que requieren una gestión eficiente y escalable.',
  'Interra',
  0,
  0,
  true,
  null,
  '[
    {"titulo": "Número de canales", "valor": "20"},
    {"titulo": "Protocolo", "valor": "KNX TP"},
    {"titulo": "Alimentación", "valor": "Bus KNX (no requiere fuente externa)"},
    {"titulo": "Configuración", "valor": "ETS (objetos variables según parametrización)"},
    {"titulo": "Control manual", "valor": "Pulsadores frontales"},
    {"titulo": "Funciones por canal", "valor": [
      "Control de iluminación",
      "Control de calefacción",
      "Control de persianas/shutters (requiere 2 salidas consecutivas)",
      "Escenas y temporizaciones",
      "Lógica (logic gates)",
      "Bloqueo / forzado",
      "Feedback configurable",
      "Working hours counter"
    ]},
    {"titulo": "Control Fan Coil", "valor": [
      "2 tubos: requiere 4 salidas consecutivas del mismo bloque",
      "4 tubos: requiere 5 salidas consecutivas del mismo bloque"
    ]},
    {"titulo": "Capacidad ETS", "valor": "600 direcciones de grupo / 600 asociaciones"},
    {"titulo": "Modelo ETS", "valor": "ITR525-XXXX"},
    {"titulo": "Montaje", "valor": "Carril DIN"},
    {"titulo": "Estructura de bloques (6 salidas por bloque)", "valor": [
      "A1–A6",
      "B7–B12",
      "C13–C18",
      "D19–D24",
      "20 canales = A, B, C completos + primeras 2 salidas del bloque D"
    ]}
  ]'::jsonb,
  '[
    {"titulo": "Protocolo", "valor": "KNX"},
    {"titulo": "Tipo de dispositivo", "valor": "Actuador"},
    {"titulo": "Serie / Modelo", "valor": "Combo +"},
    {"titulo": "Canales", "valor": "20"},
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
