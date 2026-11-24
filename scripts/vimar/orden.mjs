// Orden en el que salen los productos de Vimar Linea en el catálogo
// (columna productos.orden; menor = antes).
//
// - Por categoría: mecanismos, placas, teclas, tapas ciegas, accesorios.
// - Placas: primero las horizontales y luego las verticales. Dentro de cada
//   orientación, primero los acabados tecno blanco, cáñamo y negro (de menor a
//   mayor tamaño) y después el resto de acabados.
// - Mecanismos y teclas: cada referencia con sus colores seguidos,
//   blanco -> cáñamo -> negro.

const ORDEN_CATEGORIA = {
  'vimar-linea-mecanismos': 1,
  'vimar-linea-placas': 2,
  'vimar-linea-teclas': 3,
  'vimar-linea-tapas-ciegas': 4,
  'vimar-linea-accesorios': 5,
  'vimar-knx-linea': 6,
  'vimar-knx-eikon': 7,
  'vimar-knx-eikon-vintage': 8,
  'vimar-knx-eikon-flat-tondo': 9,
  'vimar-knx-dispositivos': 10,
  'vimar-knx-din': 11,
  'vimar-knx-software': 12,
};

// Placas: familia -> [orientación (0 horizontal, 1 vertical), tamaño]
const FAMILIAS_PLACA = {
  30642: [0, 1], // 2M
  30643: [0, 2], // 4M (2+2)
  30644: [0, 3], // 6M (2+2+2)
  30669: [0, 4], // 8M (2+2+2+2)
  30645: [1, 2], // 4M (2+2) vertical
  30646: [1, 3], // 6M (2+2+2) vertical
};

// Acabado de placa (sufijo del código) en el orden de Vimar.
const ACABADOS_PLACA = ['00', '01', '02', '20', '21', '22', '40', '41', '42', '60', '61', '62', '70.01', '71', '72'];
const TECNO = new Set(['00', '01', '02']); // tecno blanco, cáñamo, negro

// Color de mecanismos y teclas: última letra del código.
const COLORES = { B: 0, C: 1, G: 2 };

export function ordenProducto(codigo, slugCategoria, posicion) {
  const base = (ORDEN_CATEGORIA[slugCategoria] ?? 9) * 100000;

  if (slugCategoria === 'vimar-linea-placas') {
    const [familia, ...resto] = codigo.split('.');
    const acabado = resto.join('.');
    const [orientacion, tamano] = FAMILIAS_PLACA[familia] ?? [2, 9];
    const tecno = TECNO.has(acabado) ? 0 : 1;
    const indiceAcabado = ACABADOS_PLACA.indexOf(acabado);
    return base + orientacion * 10000 + tecno * 5000 + tamano * 100 + (indiceAcabado < 0 ? 99 : indiceAcabado);
  }

  // Resto: por referencia (posicion = puesto de la familia ordenada por
  // código dentro de su categoría): primero la referencia sin color (el
  // mecanismo sin tecla) y después blanco, cáñamo y negro.
  const color = COLORES[codigo.slice(-1)];
  return base + bloqueMecanismo(codigo, slugCategoria) * 10000 + posicion * 4 + (color === undefined ? 0 : color + 1);
}

// Mecanismos: primero interruptores,
// cruzamientos y conmutadores (normales, 2M, cableado rápido y axiales),
// luego el resto y al final el adaptador de toma TV-RD-SAT, la lámpara LED
// extraíble, la luz de emergencia y el mando de 4 pulsadores.
const BLOQUES_MECANISMOS = [
  [/^30000/, 1], // interruptor 1P 10AX
  [/^30012/, 2], // interruptor cruzado
  [/^30004/, 3], // conmutador
  [/^30319/, 9], // adaptador toma TV-RD-SAT
  [/^(3039[78]|30406)$/, 9], // lámpara LED, luz de emergencia y mando 4 pulsadores (detrás del adaptador)
];
function bloqueMecanismo(codigo, slugCategoria) {
  if (slugCategoria !== 'vimar-linea-mecanismos') return 0;
  return BLOQUES_MECANISMOS.find(([re]) => re.test(codigo))?.[1] ?? 5;
}

// Familia de un mecanismo/tecla: el código sin la letra de color final.
// "30000.B" y "30000" son la misma familia ("30000").
// Teclas Flat neutras iluminables (22751.01, 22751.03…): juntas, justo
// detrás de las Flat sin símbolo (22751.0.xx).
export const familiaDe = (codigo) =>
  /^22751\.\d\d$/.test(codigo) ? '22751.0~'
  : /[BCG]$/.test(codigo) && codigo.includes('.') ? codigo.slice(0, -1).replace(/\.$/, '') : codigo;
