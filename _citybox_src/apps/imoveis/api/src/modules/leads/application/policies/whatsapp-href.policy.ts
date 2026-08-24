export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Link WhatsApp (BR) — prefixa 55 quando o número parece local. */
export function whatsAppHref(phone: string, text?: string): string {
  let digits = phoneDigits(phone);
  if (digits.length >= 10 && digits.length <= 11) {
    digits = `55${digits}`;
  }
  const base = `https://wa.me/${digits}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function buildLeadDocumentWhatsAppMessage(
  leadName: string,
  documentName: string,
  shareUrl: string,
): string {
  const greeting = leadName.trim() || 'cliente';
  return `Olá ${greeting},\n\nSegue o documento "${documentName}" referente à negociação do imóvel:\n${shareUrl}\n\nFico à disposição para esclarecer dúvidas.\n\nAtenciosamente,`;
}

export function buildLeadDocumentUploadWhatsAppMessage(
  leadName: string,
  uploadUrl: string,
): string {
  const greeting = leadName.trim() || 'cliente';
  return `Olá ${greeting},\n\nPara avançarmos, envie seus documentos (PDF ou DOC) neste link, válido por 48 horas:\n${uploadUrl}\n\nAtenciosamente,`;
}
