-- ============================================================
-- Seed: KNX Actuador Dimmer Universal (Interra ITR501-XXXX)
-- Ejecutar en el SQL Editor de Supabase, DESPUÉS de:
--   sql/schema.sql
--   sql/002_atributos_y_especificaciones.sql
--
-- Se publica con precio = 0 e imagen_principal = NULL a propósito
-- (el precio no se muestra en la web todavía, así que no bloquea).
-- Edita esos campos a mano en el Table Editor de Supabase cuando
-- tengas el precio real y hayas subido la foto a Storage.
--
-- Solo se incluye la variante confirmada (2 canales, ITR501-0012).
-- Añade las otras combinaciones (4 canales, con/sin inputs) más
-- adelante desde el Table Editor cuando tengas sus SKU reales.
-- ============================================================

-- 1) Asegura que la categoría "Actuadores" existe (no hace nada si ya está creada).
insert into categorias (nombre, slug)
values ('Actuadores', 'actuadores')
on conflict (slug) do nothing;

-- 2) Producto
insert into productos (
  categoria_id,
  sku,
  nombre,
  slug,
  descripcion_corta,
  descripcion_larga,
  marca,
  precio,           -- placeholder: edítalo a mano cuando tengas el precio real
  stock,
  activo,
  datasheet_url,    -- edítalo a mano si tienes el PDF de ficha técnica
  imagen_principal, -- edítalo a mano con la URL pública de Supabase Storage
  especificaciones
)
values (
  (select id from categorias where slug = 'actuadores'),
  'ITR501-XXXX',    -- placeholder: edítalo a mano con la referencia base real
  'KNX Actuador Dimmer Universal',
  'knx-actuador-dimmer-universal',
  'Actuador universal de regulación KNX para cargas R, L y C, con detección automática de carga, protección térmica y cortocircuito, control manual por canal, curva de regulación configurable en zonas y soporte para lámparas halógenas, transformadores ferromagnéticos/electrónicos y LED regulables. Disponible en 2 o 4 canales, con opción de entradas digitales/analógicas según modelo.',
  E'El Interra KNX Universal Dimmer Actuator (serie ITR501-XXXX) permite regular cargas R, L y C con una potencia de salida por canal de 300 W / 250 W según versión, ofreciendo un control estable para lámparas incandescentes, halógenas de baja y alta tensión, transformadores ferromagnéticos/electrónicos y luminarias LED regulables.\n\nCada canal incorpora protección térmica, detección de presencia de carga, detección automática del tipo de carga, y un LED RGB de estado. El dispositivo permite control manual por canal, así como la ejecución de funciones avanzadas: bloqueo, forzado, escenarios, función de escalera (staircase), contador de horas de funcionamiento, y modos de operación configurables mediante ETS.\n\nLa función de determinación de curva de regulación permite dividir la curva en 5 zonas, ajustando la velocidad de regulación individualmente. También puede funcionar en sistemas trifásicos (3-Phase), ya que cada canal dispone de fase y neutro independientes.\n\nLas variantes con entradas integradas permiten utilizar entradas digitales (dry contact) para control de canales o envío de telegramas al bus, y entradas analógicas para sensores resistivos (NTC, LDR).\n\nDiseñado para instalación en carril DIN (6 módulos) y completamente KNX Certified, el actuador dispone de regulación universal, supervisión, protección y parametrización avanzada para integradores profesionales.',
  'Interra',
  0,                -- placeholder: edítalo a mano con el precio real
  0,                -- placeholder: edítalo a mano con el stock real
  true,
  null,
  null,
  '[
    {"titulo": "Código base", "valor": "ITR501-XXXX"},
    {"titulo": "Alimentación", "valor": "KNX Bus / Alimentación externa DC"},
    {"titulo": "Tensión de operación", "valor": "230 V AC ±10 %, 50 Hz"},
    {"titulo": "Carga regulable por canal", "valor": [
      "300 W (250 W en modo inductivo) – modelo 2 canales",
      "250 W (200 W en modo inductivo) – modelo 4 canales"
    ]},
    {"titulo": "Tipos de carga compatibles", "valor": [
      "Incandescente / Halógena",
      "Halógena LV con transformador ferromagnético (inductivo)",
      "Halógena LV con transformador electrónico (capacitivo)",
      "LED regulables / CFL",
      "Según matriz de compatibilidad del datasheet (página 2)"
    ]},
    {"titulo": "Curva de dimming", "valor": "5 zonas configurables"},
    {"titulo": "Protecciones", "valor": ["Sobrecarga / Cortocircuito", "Protección térmica"]},
    {"titulo": "Detección automática", "valor": ["Tipo de carga", "Presencia de carga"]},
    {"titulo": "Conexiones", "valor": ["1 × KNX", "1 × Ethernet", "Entradas digitales/analógicas (según variación)"]},
    {"titulo": "Montaje", "valor": "Carril DIN 35 mm – 6 módulos"},
    {"titulo": "Grado de protección", "valor": "IP20"},
    {"titulo": "Temperatura operación", "valor": "–5 °C … 45 °C"},
    {"titulo": "Humedad", "valor": "< 90 % RH"},
    {"titulo": "Dimensiones", "valor": "105 × 90 × 64 mm (H × W × D)"},
    {"titulo": "Configuración", "valor": "ETS (S-Mode)"},
    {"titulo": "Certificación", "valor": "KNX Certified"}
  ]'::jsonb
);

-- 3) Variante confirmada (2 canales, con inputs). Añade el resto más adelante
-- desde el Table Editor cuando tengas sus SKU y stock reales.
insert into producto_variantes (producto_id, nombre, sku_variante, stock, atributos)
values
  (
    (select id from productos where slug = 'knx-actuador-dimmer-universal'),
    '2 canales – Con inputs', 'ITR501-0012', 0,
    '{"canales": "2", "inputs": "con"}'::jsonb
  );
