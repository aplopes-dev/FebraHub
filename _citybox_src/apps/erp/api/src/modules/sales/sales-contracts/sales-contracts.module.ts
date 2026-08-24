import { Module } from '@nestjs/common';
import { TenancyModule } from '../../tenancy/tenancy.module';
import { SalesContractsService } from './application/sales-contracts.service';
import { ContractStatusesService } from './application/contract-statuses.service';
import { SalesContractsController } from './http/sales-contracts.controller';
import { ContractStatusesController } from './http/contract-statuses.controller';

/** Módulo fino de Contratos de Venda — CRUD + parcelas via Prisma direto. */
@Module({
  imports: [TenancyModule],
  controllers: [SalesContractsController, ContractStatusesController],
  providers: [SalesContractsService, ContractStatusesService],
})
export class SalesContractsModule {}
