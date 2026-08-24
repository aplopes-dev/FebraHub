import type { Certificate, CertificateView } from "../types/certificate";

const EXPIRES_SOON_DAYS = 30;

/**
 * Deriva as flags de UI de cada certificado e marca o **vigente**: o VALID mais
 * recente por `validUntil` (desempate por `createdAt`). Não há flag `active` no
 * schema — vale sempre o VALID mais recente (FR-018).
 */
export function toCertificateViews(
  certificates: Certificate[],
  now: Date = new Date(),
): CertificateView[] {
  const nowMs = now.getTime();

  const currentId = pickCurrentId(certificates);

  return certificates.map((cert) => {
    const validUntilMs = new Date(cert.validUntil).getTime();
    const isExpired =
      cert.status === "EXPIRED" ||
      (Number.isFinite(validUntilMs) && validUntilMs < nowMs);

    const days = cert.daysUntilExpiration;
    const expiresSoon =
      cert.status === "VALID" &&
      !isExpired &&
      days !== null &&
      days > 0 &&
      days <= EXPIRES_SOON_DAYS;

    return {
      ...cert,
      isCurrent: cert.id === currentId,
      expiresSoon,
      isExpired,
    };
  });
}

/** Separa o vigente do histórico (não-vigentes) já como views. */
export function splitCurrentAndHistory(views: CertificateView[]): {
  current: CertificateView | null;
  history: CertificateView[];
} {
  const current = views.find((v) => v.isCurrent) ?? null;
  const history = views.filter((v) => !v.isCurrent);
  return { current, history };
}

function pickCurrentId(certificates: Certificate[]): string | null {
  const valid = certificates.filter((c) => c.status === "VALID");
  if (valid.length === 0) return null;

  const sorted = [...valid].sort((a, b) => {
    const byValidUntil =
      new Date(b.validUntil).getTime() - new Date(a.validUntil).getTime();
    if (byValidUntil !== 0) return byValidUntil;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return sorted[0]?.id ?? null;
}
