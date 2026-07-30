export const languages = {
  es: 'ES',
  en: 'EN',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'es';

// Rutas que existen traducidas en /en/... — el resto de páginas (tienda,
// carrito, cuenta...) se quedan solo en español por ahora.
const TRANSLATED_PATHS = new Set([
  '/',
  '/contacto',
  '/proyectos/integradores-pro',
  '/proyectos/disenadores',
  '/proyectos/propietarios',
  '/proyectos/arquitectos',
  '/proyectos/promotoras-constructoras',
]);

export const ui = {
  es: {
    'nav.proyectos': 'Proyectos',
    'nav.tienda': 'Tienda',
    'nav.contacto': 'Contacto',
    'nav.ayuda': 'Ayuda',
    'nav.cuenta': 'Mi cuenta',
    'nav.iniciarSesion': 'Iniciar sesión',
    'nav.registrarse': 'Registrarse',
    'nav.carrito': 'Carrito',
    'nav.verTodoCatalogo': 'Ver todo el catálogo →',
    'nav.proximamente': 'Próximamente',

    'footer.proyectos': 'Proyectos',
    'footer.tienda': 'Tienda',
    'footer.enlaces': 'Enlaces',
    'footer.contacto': 'Contacto',
    'footer.miCuenta': 'Mi Cuenta',
    'footer.newsletter': 'Suscríbete a nuestra Newsletter',
    'footer.emailPlaceholder': 'Correo electrónico',
    'footer.privacidadPre': 'He leído y acepto la',
    'footer.privacidadLink': 'política de privacidad',
    'footer.enviar': 'Enviar',
    'footer.graciasSuscribirte': '¡Gracias por suscribirte!',
    'footer.avisoLegal': 'Aviso Legal',
    'footer.politicaPrivacidad': 'Política de Privacidad',
    'footer.politicaCookies': 'Política de Cookies',
    'footer.condicionesCompra': 'Condiciones Generales de Compra',
    'footer.derechos': 'Todos los derechos reservados.',

    'proyectos.integradores': 'Integradores PRO',
    'proyectos.disenadores': 'Diseñadores',
    'proyectos.propietarios': 'Propietarios',
    'proyectos.arquitectos': 'Arquitectos',
    'proyectos.promotoras': 'Promotoras / Constructoras',

    'proyecto.caracteristicas': 'Características',
    'proyecto.ctaHeading': '¿Hablamos de tu próximo proyecto?',
    'proyecto.contactar': 'Contactar',
  },
  en: {
    'nav.proyectos': 'Projects',
    'nav.tienda': 'Shop',
    'nav.contacto': 'Contact',
    'nav.ayuda': 'Help',
    'nav.cuenta': 'My account',
    'nav.iniciarSesion': 'Log in',
    'nav.registrarse': 'Sign up',
    'nav.carrito': 'Cart',
    'nav.verTodoCatalogo': 'View full catalogue →',
    'nav.proximamente': 'Coming soon',

    'footer.proyectos': 'Projects',
    'footer.tienda': 'Shop',
    'footer.enlaces': 'Links',
    'footer.contacto': 'Contact',
    'footer.miCuenta': 'My Account',
    'footer.newsletter': 'Subscribe to our Newsletter',
    'footer.emailPlaceholder': 'Email address',
    'footer.privacidadPre': 'I have read and accept the',
    'footer.privacidadLink': 'privacy policy',
    'footer.enviar': 'Submit',
    'footer.graciasSuscribirte': 'Thanks for subscribing!',
    'footer.avisoLegal': 'Legal Notice',
    'footer.politicaPrivacidad': 'Privacy Policy',
    'footer.politicaCookies': 'Cookie Policy',
    'footer.condicionesCompra': 'General Terms of Purchase',
    'footer.derechos': 'All rights reserved.',

    'proyectos.integradores': 'Integrators PRO',
    'proyectos.disenadores': 'Designers',
    'proyectos.propietarios': 'Homeowners',
    'proyectos.arquitectos': 'Architects',
    'proyectos.promotoras': 'Developers / Contractors',

    'proyecto.caracteristicas': 'Features',
    'proyecto.ctaHeading': 'Shall we talk about your next project?',
    'proyecto.contactar': 'Contact us',
  },
} as const;

type UiKey = keyof (typeof ui)['es'];

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (maybeLang === 'en') return 'en';
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

// Enlace a una página que SÍ existe traducida (home, contacto, proyectos/*).
// path siempre en su forma "española" sin prefijo, ej: '/contacto'.
export function localizedHref(path: string, lang: Lang): string {
  if (lang === defaultLang) return path;
  return path === '/' ? '/en' : `/en${path}`;
}

// Para el selector de idioma: calcula a dónde debe ir el enlace ES/EN según
// la página actual. Si la página actual no tiene traducción, cae a la home
// de ese idioma en vez de a un enlace roto.
export function getSwitcherHref(pathname: string, targetLang: Lang): string {
  const stripped = (pathname.replace(/^\/en(\/|$)/, '/').replace(/\/$/, '') || '/');
  const base = TRANSLATED_PATHS.has(stripped) ? stripped : '/';
  return localizedHref(base, targetLang);
}
