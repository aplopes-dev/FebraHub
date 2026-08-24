import type { Certificate } from "../types/certificate";
import type { CertificateDto } from "./fiscal-certificate.dto";

/** DTO da fiscal-api → view model de certificado (sem `daysUntilExpiration`, que vem do /status). */
export function toCertificate(dto: CertificateDto): Certificate {
  return {
    id: dto.id,
    companyId: dto.companyId,
    type: dto.type,
    name: dto.name,
    subjectCnpj: dto.subjectCnpj,
    validFrom: dto.validFrom,
    validUntil: dto.validUntil,
    status: dto.status,
    createdAt: dto.createdAt,
    daysUntilExpiration: null,
  };
}
