import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { FiscalApiProvider } from './domain/providers/fiscal-api.provider';
import { HttpFiscalApiAdapter } from './infrastructure/http-fiscal-api.adapter';
import { ResolveFiscalCompanyUseCase } from './application/use-cases/resolve-fiscal-company/resolve-fiscal-company.use-case';
import { ListFiscalDocumentsRoute } from './infrastructure/http/routes/list-fiscal-documents/list-fiscal-documents.route';
import { GetFiscalSummaryRoute } from './infrastructure/http/routes/get-fiscal-summary/get-fiscal-summary.route';

/**
 * Ponte da `erp-api` para a `services/fiscal-api` (ADR C-16).
 *
 * Existe porque a `fiscal-api` deixou de aceitar token de usuário final: ela
 * confia no sistema chamador, e quem sabe se "este usuário pode operar este
 * Emitente" é o ERP — a `fiscal-api` não conhece `erp.memberships`.
 *
 * Importa `TenancyModule` pelo `OrganizationRepository`: é do CNPJ da
 * organização ativa que o Emitente é derivado.
 */
@Module({
  imports: [TenancyModule],
  controllers: [ListFiscalDocumentsRoute, GetFiscalSummaryRoute],
  providers: [
    { provide: FiscalApiProvider, useClass: HttpFiscalApiAdapter },
    ResolveFiscalCompanyUseCase,
  ],
})
export class FiscalModule {}
