export const tiendaMenu = [
  {
    grupo: 'Domótica',
    categorias: [
      { nombre: 'Actuadores', slug: 'actuadores' },
      { nombre: 'Paneles Táctiles KNX', slug: 'paneles-tactiles-knx' },
      { nombre: 'Fuentes de alimentación', slug: 'fuentes-de-alimentacion' },
      { nombre: 'Gateways', slug: 'gateways' },
      { nombre: 'Interfaces y acopladores', slug: 'interfaces-y-acopladores' },
      { nombre: 'Sensores', slug: 'sensores' },
      { nombre: 'Servidores', slug: 'servidores' },
      { nombre: 'Protocolo propietario', slug: 'protocolo-propietario' },
    ],
  },
  {
    grupo: 'Interruptores/Mecanismos',
    categorias: [{ nombre: 'Pulsadores', slug: 'pulsadores' }],
  },
  {
    grupo: 'Iluminación / Electricidad',
    categorias: [{ nombre: 'DALI', slug: 'dali' }],
  },
  {
    grupo: 'Sonido',
    categorias: [
      { nombre: 'Altavoces de techo', slug: 'altavoces-techo' },
      { nombre: 'Altavoces de pie', slug: 'altavoces-pie' },
      { nombre: 'Altavoces de pared', slug: 'altavoces-pared' },
      { nombre: 'Altavoces de exterior', slug: 'altavoces-exterior' },
      { nombre: 'Amplificadores', slug: 'amplificadores' },
    ],
  },
];

export const categorias = tiendaMenu.flatMap((g) => g.categorias);

// Marcas que siempre aparecen como filtro, aunque todavía no haya productos publicados con ellas.
export const marcasBase = ['Vimar', 'Interra', 'Sonos'];
