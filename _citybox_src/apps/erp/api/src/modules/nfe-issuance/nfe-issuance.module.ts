import { Module, forwardRef } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { FiscalDefaultsModule } from '../fiscal-defaults/fiscal-defaults.module';
import { SalesModule } from '../sales/sales.module';
import { CatalogModule } from '../catalog/catalog.module';
import { PaymentMethodsModule } from '../finance/payment-methods/payment-methods.module';
import { NfeIssuanceRepository } from './domain/repositories/nfe-issuance.repository.interface';
import { FiscalApiClient } from './domain/providers/fiscal-api-client.interface';
import { PrismaNfeIssuanceRepository } from './infrastructure/database/prisma-nfe-issuance.repository';
import { HttpFiscalApiClient } from './infrastructure/providers/http-fiscal-api-client';
import { ResolveSaleOrderItemsService } from './application/services/resolve-sale-order-items';
import { IssueNfeUseCase } from './application/use-cases/issue-nfe/issue-nfe.use-case';
import { PreviewNfeIssuanceUseCase } from './application/use-cases/preview-nfe-issuance/preview-nfe-issuance.use-case';
import { ListNfeIssuancesUseCase } from './application/use-cases/list-nfe-issuances/list-nfe-issuances.use-case';
import { NfeIssuanceRoute } from './infrastructure/http/routes/nfe-issuance.route';

/**
 * Emissão de NF-e a partir de um pedido de venda (spec erp/026). Liga o ERP à
 * `services/fiscal-api` com a parametrização fiscal real do produto — resolve
 * ICMS/PIS-COFINS/IPI por linha (`FiscalDefaultsModule`, resolvedores já
 * existentes, só não eram chamados por nenhum caso de uso real), lê o pedido
 * (`SalesModule`) e o cadastro fiscal do produto (`CatalogModule`), transmite
 * pelo `FiscalApiClient` e registra o vínculo `NfeIssuance` (único por
 * `saleOrderId` — FR-006). `PaymentMethodsModule` (spec erp/029): resolve o
 * `tPag` real de cada pagamento do pedido, em vez do `99` fixo antigo.
 *
 * `forwardRef(() => SalesModule)`: `SalesModule` também importa este módulo
 * (via `NfeIssuanceRepository`, spec erp/029/FR-010 — a listagem de Vendas/
 * Pedidos de venda expõe o vínculo NF-e sem N+1) — dependência genuinamente
 * bidirecional, `forwardRef` nos dois lados é o padrão já usado noutros
 * módulos deste app (ex. `financial-entries`).
 */
@Module({
  imports: [
    TenancyModule,
    FiscalDefaultsModule,
    forwardRef(() => SalesModule),
    CatalogModule,
    PaymentMethodsModule,
  ],
  controllers: [NfeIssuanceRoute],
  providers: [
    {
      provide: NfeIssuanceRepository,
      useClass: PrismaNfeIssuanceRepository,
    },
    {
      provide: FiscalApiClient,
      useClass: HttpFiscalApiClient,
    },
    ResolveSaleOrderItemsService,
    IssueNfeUseCase,
    PreviewNfeIssuanceUseCase,
    ListNfeIssuancesUseCase,
  ],
  exports: [IssueNfeUseCase, NfeIssuanceRepository],
})
export class NfeIssuanceModule {}
