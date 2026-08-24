import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { OperationNatureRepository } from './domain/repositories/operation-nature.repository.interface';
import { PrismaOperationNatureRepository } from './infrastructure/database/prisma-operation-nature.repository';
import { ListOperationNaturesUseCase } from './application/use-cases/list-operation-natures/list-operation-natures.use-case';
import { GetOperationNatureUseCase } from './application/use-cases/get-operation-nature/get-operation-nature.use-case';
import { CreateOperationNatureUseCase } from './application/use-cases/create-operation-nature/create-operation-nature.use-case';
import { UpdateOperationNatureUseCase } from './application/use-cases/update-operation-nature/update-operation-nature.use-case';
import { DeleteOperationNatureUseCase } from './application/use-cases/delete-operation-nature/delete-operation-nature.use-case';
import { ResolveOperationNatureUseCase } from './application/use-cases/resolve-operation-nature/resolve-operation-nature.use-case';
import { OperationNatureRoute } from './infrastructure/http/routes/operation-nature.route';

/**
 * Naturezas de Operação (spec erp/020) — regras de-para que, dada uma operação de
 * entrada, determinam CFOP e grupos fiscais da saída correspondente (devolução para
 * fornecedor). `ResolveOperationNatureUseCase` (exportado) resolve a regra; a emissão
 * real (disparo entrada/devolução) é **B7**, fora desta fatia.
 */
@Module({
  imports: [TenancyModule],
  controllers: [OperationNatureRoute],
  providers: [
    {
      provide: OperationNatureRepository,
      useClass: PrismaOperationNatureRepository,
    },
    ListOperationNaturesUseCase,
    GetOperationNatureUseCase,
    CreateOperationNatureUseCase,
    UpdateOperationNatureUseCase,
    DeleteOperationNatureUseCase,
    ResolveOperationNatureUseCase,
  ],
  exports: [ResolveOperationNatureUseCase],
})
export class OperationNaturesModule {}
