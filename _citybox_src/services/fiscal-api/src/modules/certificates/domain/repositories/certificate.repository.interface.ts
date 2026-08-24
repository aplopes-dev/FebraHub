import type { Certificate } from '../entities/certificate.entity';

export abstract class CertificateRepository {
  abstract findById(id: string): Promise<Certificate | null>;
  /// Certificado VALID mais recente de um Emitente — usado por nfe/nfse
  /// (US1/US2) antes de assinar qualquer documento (FR-008). O sistema
  /// tolera mais de uma linha `VALID` simultânea por Emitente (upload de um
  /// novo certificado não invalida automaticamente o anterior — ver
  /// UploadCertificateUseCase, US3); esta consulta sempre resolve para o
  /// mais recente por `createdAt`.
  abstract findValidByCompanyId(companyId: string): Promise<Certificate | null>;
  abstract findAllByCompanyId(companyId: string): Promise<Certificate[]>;
  /// Upsert (create-or-update) — usado por `UploadCertificateUseCase` (US3).
  abstract save(certificate: Certificate): Promise<Certificate>;
}
