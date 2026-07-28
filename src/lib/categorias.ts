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
    categorias: [],
  },
];

export const categorias = tiendaMenu.flatMap((g) => g.categorias);
