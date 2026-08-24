export function buildPatientWhatsAppUrl(
  phone: string | null | undefined,
  patientName: string,
): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;

  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  const firstName = patientName.trim().split(/\s+/)[0] || patientName;
  const message = encodeURIComponent(`Olá ${firstName}!`);
  return `https://wa.me/${withCountry}?text=${message}`;
}
