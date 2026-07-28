-- ============================================================
-- Seed: Interra Combo+ Actuador KNX de 24 canales (ITR525-XXXX)
-- Ejecutar en el SQL Editor de Supabase después de:
--   sql/schema.sql, 002_..., 003_..., 004_...
--
-- Igual que el actuador dimmer: precio = 0 e imagen_principal = NULL
-- a propósito. Edítalos a mano en el Table Editor cuando tengas el
-- precio real y hayas subido la foto a Storage. El SKU también es
-- un placeholder (el manual solo da el código base ITR525-XXXX, sin
-- variantes) — sustitúyelo por la referencia real cuando la tengas.
--
-- Este producto no tiene variantes (no hay opción de canales/inputs
-- distintos), así que "Canales: 24" va explícito en info_adicional.
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
  'ITR525-XXXX',
  'Interra Combo+ Actuador KNX de 24 canales',
  'interra-combo-plus-actuador-knx-24-canales',
  'Actuador combinado KNX de 24 canales, configurable mediante ETS para iluminación, calefacción, persianas y sistemas Fan Coil. Alimentación por bus KNX y control manual integrado en cada salida.',
  E'El Interra Combo+ de 24 canales es el actuador de mayor capacidad de la serie, diseñado para instalaciones KNX que requieren un número elevado de salidas y funciones avanzadas de control. Cada canal es configurable desde ETS, permitiendo asignaciones independientes para iluminación, calefacción, control de persianas y operación de sistemas Fan Coil.\n\nLa comunicación mediante bus KNX permite una integración total con sensores KNX, otros actuadores y sistemas de gestión de edificios (BMS). En caso de fallo de comunicación, el actuador permite el control manual de cada salida mediante pulsadores frontales, garantizando continuidad operativa.\n\nEl dispositivo se alimenta directamente desde el bus KNX, sin necesidad de fuente externa. Permite hasta 600 direcciones de grupo y 600 asociaciones, según configuración (Product Code ITR525-XXXX).\n\nIncluye funciones avanzadas como temporizaciones, escenas, puertas lógicas, bloqueos, funciones de forzado, contadores de horas de uso, monitorización periódica y memoria del último estado tras fallo eléctrico. Es adecuado para entornos residenciales, hoteleros y comerciales de gran escala.',
  'Interra',
  0,
  0,
  true,
  null,
  '[
    {"titulo": "Número de canales", "valor": "24"},
    {"titulo": "Protocolo", "valor": "KNX TP"},
    {"titulo": "Alimentación", "valor": "Bus KNX (sin fuente adicional)"},
    {"titulo": "Configuración", "valor": "ETS (objetos según ajuste en ETS)"},
    {"titulo": "Control manual", "valor": "Pulsadores integrados por canal"},
    {"titulo": "Funciones por canal", "valor": [
      "Control de iluminación",
      "Control de calefacción",
      "Control de persianas/shutters (requiere 2 salidas consecutivas)",
      "Funciones de temporización",
      "Escenas",
      "Lógica (logic gates)",
      "Bloqueo / forzado",
      "Telegramas de feedback configurables",
      "Contador de horas de funcionamiento"
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
      "24 canales = los 4 bloques completos: A, B, C y D"
    ]}
  ]'::jsonb,
  '[
    {"titulo": "Protocolo", "valor": "KNX"},
    {"titulo": "Tipo de dispositivo", "valor": "Actuador"},
    {"titulo": "Serie / Modelo", "valor": "Combo +"},
    {"titulo": "Canales", "valor": "24"},
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
