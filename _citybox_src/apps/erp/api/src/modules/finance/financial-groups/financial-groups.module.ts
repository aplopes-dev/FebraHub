import { Module } from '@nestjs/common';

import { FinancialGroupRepository } from './domain/repositories/financial-group.repository.interface';
import { PrismaFinancialGroupRepository } from './infrastructure/database/prisma-financial-group.repository';

import { CreateFinancialGroupUseCase } from './application/use-cases/create-financial-group/create-financial-group.use-case';
import { ListFinancialGroupsUseCase } from './application/use-cases/list-financial-groups/list-financial-groups.use-case';
import { FindFinancialGroupByIdUseCase } from './application/use-cases/find-financial-group-by-id/find-financial-group-by-id.use-case';
import { UpdateFinancialGroupUseCase } from './application/use-cases/update-financial-group/update-financial-group.use-case';
import { DeleteFinancialGroupUseCase } from './application/use-cases/delete-financial-group/delete-financial-group.use-case';
import { RestoreFinancialGroupUseCase } from './application/use-cases/restore-financial-group/restore-financial-group.use-case';

import { CreateFinancialGroupRoute } from './infrastructure/http/routes/create-financial-group/create-financial-group.route';
import { ListFinancialGroupsRoute } from './infrastructure/http/routes/list-financial-groups/list-financial-groups.route';
import { FindFinancialGroupByIdRoute } from './infrastructure/http/routes/find-financial-group-by-id/find-financial-group-by-id.route';
import { UpdateFinancialGroupRoute } from './infrastructure/http/routes/update-financial-group/update-financial-group.route';
import { DeleteFinancialGroupRoute } from './infrastructure/http/routes/delete-financial-group/delete-financial-group.route';
import { RestoreFinancialGroupRoute } from './infrastructure/http/routes/restore-financial-group/restore-financial-group.route';

/**
 * Grupos financeiros: a classificação de topo (`receita`/`despesa`) que o plano
 * de contas usa. Soft-delete com restauração, e exclusão bloqueada enquanto
 * houver conta do plano ativa apontando para o grupo.
 */
@Module({
  // Ordem importa: as rotas de caminho fixo antes de `:id`, para o Nest não
  // tratar um segmento fixo como parâmetro.
  controllers: [
    ListFinancialGroupsRoute,
    CreateFinancialGroupRoute,
    RestoreFinancialGroupRoute,
    FindFinancialGroupByIdRoute,
    UpdateFinancialGroupRoute,
    DeleteFinancialGroupRoute,
  ],
  providers: [
    {
      provide: FinancialGroupRepository,
      useClass: PrismaFinancialGroupRepository,
    },
    CreateFinancialGroupUseCase,
    ListFinancialGroupsUseCase,
    FindFinancialGroupByIdUseCase,
    UpdateFinancialGroupUseCase,
    DeleteFinancialGroupUseCase,
    RestoreFinancialGroupUseCase,
  ],
  exports: [FinancialGroupRepository],
})
export class FinancialGroupsModule {}
