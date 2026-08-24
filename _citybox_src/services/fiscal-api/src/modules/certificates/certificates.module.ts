import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { CertificateRepository } from './domain/repositories/certificate.repository.interface';
import { PrismaCertificateRepository } from './infrastructure/database/prisma-certificate.repository';
import { UploadCertificateUseCase } from './application/use-cases/upload-certificate/upload-certificate.use-case';
import { ActivateCertificateUseCase } from './application/use-cases/activate-certificate/activate-certificate.use-case';
import { GetCertificateStatusUseCase } from './application/use-cases/get-certificate-status/get-certificate-status.use-case';
import { ListCertificatesUseCase } from './application/use-cases/list-certificates/list-certificates.use-case';
import { UploadCertificateRoute } from './infrastructure/http/routes/upload-certificate/upload-certificate.route';
import { ListCertificatesRoute } from './infrastructure/http/routes/list-certificates/list-certificates.route';
import { ActivateCertificateRoute } from './infrastructure/http/routes/activate-certificate/activate-certificate.route';
import { GetCertificateStatusRoute } from './infrastructure/http/routes/get-certificate-status/get-certificate-status.route';

/// US3 (P3) — upload/validação/guarda segura do certificado A1 (FR-007) e
/// consulta de validade (FR-008). `nfe`/`nfse` (US1/US2) continuam
/// dependendo só de `CertificateRepository` (leitura, exportado aqui), sem
/// precisar dos casos de uso/rotas de escrita deste módulo.
@Module({
  imports: [CompaniesModule],
  controllers: [
    UploadCertificateRoute,
    ListCertificatesRoute,
    ActivateCertificateRoute,
    GetCertificateStatusRoute,
  ],
  providers: [
    { provide: CertificateRepository, useClass: PrismaCertificateRepository },
    UploadCertificateUseCase,
    ActivateCertificateUseCase,
    GetCertificateStatusUseCase,
    ListCertificatesUseCase,
  ],
  exports: [CertificateRepository],
})
export class CertificatesModule {}
