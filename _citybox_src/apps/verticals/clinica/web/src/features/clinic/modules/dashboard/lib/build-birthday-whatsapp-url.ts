/**
 * Monta URL do WhatsApp para mensagem de aniversário.
 * Normaliza o telefone: se já começa com 55 (Brasil), não duplica o DDI.
 */
export function buildBirthdayWhatsAppUrl(
  phone: string,
  patientName: string,
): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  const firstName = patientName.trim().split(/\s+/)[0] || patientName;
  const message = encodeURIComponent(
    `Olá ${firstName}! A equipe da clínica deseja um feliz aniversário! 🎉`,
  );

  return `https://wa.me/${withCountry}?text=${message}`;
}
