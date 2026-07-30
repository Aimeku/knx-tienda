// Envío de emails vía Resend (https://resend.com). Si todavía no has
// configurado RESEND_API_KEY, esta función no falla: simplemente avisa por
// consola y no envía nada, para no romper el registro/aprobación mientras
// tanto.
const FROM_EMAIL = 'AVCI Smart Homes <info@avci.es>';

type EnviarEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function enviarEmail({ to, subject, html }: EnviarEmailParams) {
  const apiKey = import.meta.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY no configurada todavía: no se envía "${subject}" a ${to}`);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      console.error('[email] Error al enviar:', await res.text());
    }
  } catch (err) {
    console.error('[email] Error al enviar:', err);
  }
}
