import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { StorageModule } from '../../shared/infra/storage/storage.module';
import { TenantAccessModule } from '../../shared/infra/tenant/tenant-access.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { CompaniesModule } from '../companies/companies.module';
import { StatusCheckRepository } from './domain/status-check.repository';
import { PrismaStatusCheckRepository } from './infrastructure/prisma-status-check.repository';
import { SefazBaStatusProbe } from './infrastructure/sefaz-ba-status.probe';
import { NfseStatusProbe } from './infrastructure/nfse-status.probe';
import { CheckSefazStatusUseCase } from './application/use-cases/check-sefaz-status/check-sefaz-status.use-case';
import { CheckStatusRoute } from './infrastructure/http/routes/check-status/check-status.route';

/// Feature `specs/fiscal/001-sefaz-status` — consulta de disponibilidade dos
/// órgãos fiscais (NF-e, NFC-e, NFS-e), separada de qualquer emissão.
///
/// Distingue "o órgão respondeu que está fora" de "não obtivemos resposta". A
/// última verificação vive numa tabela do schema `fiscal` (cache + auditoria),
/// serializada por advisory lock para não furar o limite do órgão (FR-007b).
@Module({
  imports: [
    PrismaModule,
    StorageModule,
    TenantAccessModule,
    CertificatesModule,
    CompaniesModule,
  ],
  controllers: [CheckStatusRoute],
  providers: [
    { provide: StatusCheckRepository, useClass: PrismaStatusCheckRepository },
    SefazBaStatusProbe,
    NfseStatusProbe,
    CheckSefazStatusUseCase,
  ],
})
export class SefazStatusModule {}
