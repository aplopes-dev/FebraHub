/** Contato resolvido de um lead — usado em popovers de WhatsApp, e-mail e ligação. */

export type LeadContactInfo = {
  name: string;
  email?: string;
  phone?: string;
};

export function contactFromLead(lead: {
  name: string;
  email?: string;
  phone?: string;
}): LeadContactInfo {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
  };
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function telHref(phone: string): string {
  return `tel:${phoneDigits(phone)}`;
}

export function mailtoHref(email: string): string {
  return `mailto:${email}`;
}

/** Link WhatsApp (BR) — prefixa 55 quando o número parece local.
 * Mensagem sempre com `encodeURIComponent` (emojis, acentos, `%0A`).
 */
export function whatsAppHref(phone: string, text?: string): string {
  let digits = phoneDigits(phone);
  if (digits.length >= 10 && digits.length <= 11) {
    digits = `55${digits}`;
  }
  const base = `https://wa.me/${digits}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function hasLeadContact(contact: LeadContactInfo): boolean {
  return Boolean(contact.email?.trim() || contact.phone?.trim());
}
