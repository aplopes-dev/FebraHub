import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { FiscalDefaultsModule } from '../fiscal-defaults/fiscal-defaults.module';
import { NfseIssuanceRepository } from './domain/repositories/nfse-issuance.repository.interface';
import { FiscalApiClient } from './domain/providers/fiscal-api-client.interface';
import { PrismaNfseIssuanceRepository } from './infrastructure/database/prisma-nfse-issuance.repository';
import { HttpFiscalApiClient } from './infrastructure/providers/http-fiscal-api-client';
import { IssueNfseUseCase } from './application/use-cases/issue-nfse/issue-nfse.use-case';
import { ListNfseIssuancesUseCase } from './application/use-cases/list-nfse-issuances/list-nfse-issuances.use-case';
import { NfseIssuanceRoute } from './infrastructure/http/routes/nfse-issuance.route';

/**
 * Emissão de NFS-e pelo ERP (spec erp/018). Liga o ERP à `services/fiscal-api`
 * (que ninguém acionava): resolve o Grupo de ISSQN (via `FiscalDefaultsModule`),
 * monta o `IssueNfseDto`, transmite pelo `FiscalApiClient` e registra o vínculo
 * `NfseIssuance` com idempotência local.
 */
@Module({
  imports: [TenancyModule, FiscalDefaultsModule],
  controllers: [NfseIssuanceRoute],
  providers: [
    {
      provide: NfseIssuanceRepository,
      useClass: PrismaNfseIssuanceRepository,
    },
    {
      provide: FiscalApiClient,
      useClass: HttpFiscalApiClient,
    },
    IssueNfseUseCase,
    ListNfseIssuancesUseCase,
  ],
  exports: [IssueNfseUseCase],
})
export class NfseIssuanceModule {}
