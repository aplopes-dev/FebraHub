import type { Certificate } from '../../../../domain/entities/certificate.entity';

/// FR-007 — NUNCA inclui `encryptedPassword`/`encryptedPfxObjectKey` (nem
/// nada derivado deles) em nenhuma resposta HTTP.
export function toCertificateResponse(certificate: Certificate) {
  return {
    id: certificate.id,
    companyId: certificate.companyId,
    type: certificate.type,
    name: certificate.name,
    subjectCnpj: certificate.subjectCnpj,
    validFrom: certificate.validFrom,
    validUntil: certificate.validUntil,
    status: certificate.status,
    createdAt: certificate.createdAt,
  };
}
