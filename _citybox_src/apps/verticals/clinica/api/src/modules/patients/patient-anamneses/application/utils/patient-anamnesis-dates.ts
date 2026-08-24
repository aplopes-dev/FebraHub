export const PATIENT_ANAMNESIS_LINK_VALIDITY_DAYS = 30;

export function getPatientAnamnesisLinkExpiresAt(fromDate = new Date()): Date {
  const expiresAt = new Date(fromDate);
  expiresAt.setDate(expiresAt.getDate() + PATIENT_ANAMNESIS_LINK_VALIDITY_DAYS);
  return expiresAt;
}

export function toIssuedAtDate(fromDate = new Date()): Date {
  return new Date(
    Date.UTC(
      fromDate.getUTCFullYear(),
      fromDate.getUTCMonth(),
      fromDate.getUTCDate(),
    ),
  );
}
