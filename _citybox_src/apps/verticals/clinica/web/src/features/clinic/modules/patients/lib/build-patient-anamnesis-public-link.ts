const PATIENT_ANAMNESIS_LINK_VALIDITY_DAYS = 30;

export function getPatientAnamnesisLinkExpiresAt(fromDate = new Date()): string {
  const expiresAt = new Date(fromDate);
  expiresAt.setDate(expiresAt.getDate() + PATIENT_ANAMNESIS_LINK_VALIDITY_DAYS);
  return expiresAt.toISOString();
}

export function buildPatientAnamnesisPublicLink(origin: string, token: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/public/clinic/anamnese/${token}`;
}

export function buildPatientAnamnesisWhatsAppUrl(
  phone: string,
  patientName: string,
  link: string,
): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  const message = encodeURIComponent(
    `Olá ${patientName}, preencha sua anamnese pelo link: ${link}`,
  );
  return `https://wa.me/55${digits}?text=${message}`;
}

export const PATIENT_ANAMNESIS_LINK_EXPIRY_LABEL = `Link expira em ${PATIENT_ANAMNESIS_LINK_VALIDITY_DAYS} dias`;
