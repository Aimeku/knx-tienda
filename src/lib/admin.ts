// Emails con acceso al panel de administración (/admin/solicitudes).
// Añade más correos aquí si en el futuro más personas deben poder aprobar cuentas.
export const ADMIN_EMAILS = ['sergio@avci.es'];

export function esAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
