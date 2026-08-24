import { Module } from '@nestjs/common';
import { TenancyModule } from '../../tenancy/tenancy.module';
import { SaleOrderRepository } from '../domain/repositories/sale-order.repository.interface';
import { PrismaSaleOrderRepository } from '../infrastructure/database/prisma-sale-order.repository';
import { ServiceOrdersService } from './application/service-orders.service';
import { ServiceOrderStatusesService } from './application/service-order-statuses.service';
import { ServiceOrdersController } from './http/service-orders.controller';
import { ServiceOrderStatusesController } from './http/service-order-statuses.controller';

/**
 * Módulo fino de Ordens de Serviço — CRUD direto via Prisma + geração de
 * `SaleOrder` (`generate-sale`). Registra sua própria instância de
 * `SaleOrderRepository` (mesmo token do módulo `sales`) para não depender de
 * `SalesModule` e evitar import circular — os dois usam a mesma implementação
 * Prisma, então não há divergência de comportamento.
 */
@Module({
  imports: [TenancyModule],
  controllers: [ServiceOrdersController, ServiceOrderStatusesController],
  providers: [
    { provide: SaleOrderRepository, useClass: PrismaSaleOrderRepository },
    ServiceOrdersService,
    ServiceOrderStatusesService,
  ],
})
export class ServiceOrdersModule {}
