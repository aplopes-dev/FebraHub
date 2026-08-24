import { Module, forwardRef } from '@nestjs/common';

import { TenancyModule } from '../tenancy/tenancy.module';
import { StockModule } from '../stock/stock.module';
import { CustomersModule } from '../customers/customers.module';
import { NfeIssuanceModule } from '../nfe-issuance/nfe-issuance.module';

import { SaleOrderRepository } from './domain/repositories/sale-order.repository.interface';
import { PrismaSaleOrderRepository } from './infrastructure/database/prisma-sale-order.repository';

import { CreateSaleOrderUseCase } from './application/use-cases/create-sale-order/create-sale-order.use-case';
import { UpdateSaleOrderUseCase } from './application/use-cases/update-sale-order/update-sale-order.use-case';
import { ListSaleOrdersUseCase } from './application/use-cases/list-sale-orders/list-sale-orders.use-case';
import { FindSaleOrderByIdUseCase } from './application/use-cases/find-sale-order-by-id/find-sale-order-by-id.use-case';
import { UpdateSaleOrderStatusUseCase } from './application/use-cases/update-sale-order-status/update-sale-order-status.use-case';
import { DeleteSaleOrderUseCase } from './application/use-cases/delete-sale-order/delete-sale-order.use-case';
import { RestoreSaleOrderUseCase } from './application/use-cases/restore-sale-order/restore-sale-order.use-case';

import { CreateSaleOrderRoute } from './infrastructure/http/routes/create-sale-order/create-sale-order.route';
import { UpdateSaleOrderRoute } from './infrastructure/http/routes/update-sale-order/update-sale-order.route';
import { ListSaleOrdersRoute } from './infrastructure/http/routes/list-sale-orders/list-sale-orders.route';
import { FindSaleOrderByIdRoute } from './infrastructure/http/routes/find-sale-order-by-id/find-sale-order-by-id.route';
import { UpdateSaleOrderStatusRoute } from './infrastructure/http/routes/update-sale-order-status/update-sale-order-status.route';
import { DeleteSaleOrderRoute } from './infrastructure/http/routes/delete-sale-order/delete-sale-order.route';
import { RestoreSaleOrderRoute } from './infrastructure/http/routes/restore-sale-order/restore-sale-order.route';

import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { SalesContractsModule } from './sales-contracts/sales-contracts.module';
import { PromotionsModule } from './promotions/promotions.module';

/**
 * Módulo de vendas — pedidos de venda (Clean Architecture, integrado ao
 * estoque via `StockModule`) + submódulos "finos" (OS, contratos e promoções)
 * construídos direto sobre o Prisma para viabilizar as fases 5-8 rapidamente.
 * Ver `AGENTS.md` §9/§12.
 *
 * Contas bancárias e lançamentos financeiros saíram daqui para
 * `modules/finance/{bank-accounts,financial-entries}` em Clean Architecture. O
 * recebível do pedido fechado continua nascendo no
 * `PrismaSaleOrderRepository` (`maybeCreateReceivable`), na mesma transação da
 * venda — é efeito de infraestrutura, não depende daqueles módulos.
 *
 * `forwardRef(() => NfeIssuanceModule)` (spec erp/029, FR-010): a listagem de
 * pedidos expõe o vínculo NF-e (`ListSaleOrdersUseCase` lê
 * `NfeIssuanceRepository`) — `NfeIssuanceModule` já importa `SalesModule` na
 * outra direção (para ler o pedido na hora de emitir), então a dependência é
 * genuinamente bidirecional.
 */
@Module({
  imports: [
    TenancyModule,
    StockModule,
    CustomersModule,
    ServiceOrdersModule,
    SalesContractsModule,
    PromotionsModule,
    forwardRef(() => NfeIssuanceModule),
  ],
  controllers: [
    ListSaleOrdersRoute,
    CreateSaleOrderRoute,
    FindSaleOrderByIdRoute,
    UpdateSaleOrderRoute,
    UpdateSaleOrderStatusRoute,
    DeleteSaleOrderRoute,
    RestoreSaleOrderRoute,
  ],
  providers: [
    { provide: SaleOrderRepository, useClass: PrismaSaleOrderRepository },
    CreateSaleOrderUseCase,
    UpdateSaleOrderUseCase,
    ListSaleOrdersUseCase,
    FindSaleOrderByIdUseCase,
    UpdateSaleOrderStatusUseCase,
    DeleteSaleOrderUseCase,
    RestoreSaleOrderUseCase,
  ],
  exports: [SaleOrderRepository, CreateSaleOrderUseCase],
})
export class SalesModule {}
