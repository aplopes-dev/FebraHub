import type { PublicLeadEmailPayload } from '../../application/ports/public-lead-mailer.port';

export type PublicLeadEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function displayOrDash(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

export function buildPublicLeadEmailContent(
  payload: PublicLeadEmailPayload,
): PublicLeadEmailContent {
  const propertyPart = payload.propertyName?.trim()
    ? ` — ${payload.propertyName.trim()}`
    : '';
  const subject = `[Citybox Imóveis] Novo contato: ${payload.leadName}${propertyPart}`;

  const phone = displayOrDash(payload.leadPhone);
  const email = displayOrDash(payload.leadEmail);
  const message = displayOrDash(payload.message);
  const property = displayOrDash(payload.propertyName);

  const text = [
    `Olá, ${payload.agentName}.`,
    '',
    'Você recebeu um novo contato pelo catálogo público.',
    '',
    '── Dados enviados pelo cliente ──',
    `Nome: ${payload.leadName}`,
    `Telefone: ${phone}`,
    `E-mail: ${email}`,
    `Imóvel de interesse: ${property}`,
    `Mensagem:`,
    message,
    '',
    '── Referência ──',
    `ID do lead: ${payload.leadId}`,
    `Catálogo: ${payload.agentSlug}`,
    `Loja: ${payload.storeId}`,
  ].join('\n');

  const rows: { label: string; value: string }[] = [
    { label: 'Nome', value: payload.leadName },
    { label: 'Telefone', value: phone },
    { label: 'E-mail', value: email },
    { label: 'Imóvel', value: property },
    { label: 'Mensagem', value: message },
  ];

  const rowsHtml = rows
    .map(
      (row) =>
        `<tr><td style="padding:8px 16px 8px 0;color:#667085;vertical-align:top;white-space:nowrap;font-size:14px">${escapeHtml(row.label)}</td><td style="padding:8px 0;color:#101828;font-size:14px;white-space:pre-wrap">${escapeHtml(row.value)}</td></tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#101828;margin:0;padding:24px;background:#f9fafb">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eaecf0;border-radius:16px;padding:24px">
    <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#f97316">Citybox Imóveis</p>
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;letter-spacing:-0.02em">Novo contato do catálogo</h1>
    <p style="margin:0 0 20px;color:#475467;font-size:14px">Olá, <strong>${escapeHtml(payload.agentName)}</strong> — um cliente enviou o formulário do seu catálogo.</p>
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#667085;text-transform:uppercase;letter-spacing:0.03em">Dados enviados pelo cliente</p>
    <table style="border-collapse:collapse;width:100%;margin:0 0 20px">${rowsHtml}</table>
    <p style="margin:0;font-size:12px;color:#98a2b3">ID do lead: ${escapeHtml(payload.leadId)} · Catálogo: ${escapeHtml(payload.agentSlug)}</p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
