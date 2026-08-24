import { Module } from '@nestjs/common';

import { CostCenterRepository } from './domain/repositories/cost-center.repository.interface';
import { PrismaCostCenterRepository } from './infrastructure/database/prisma-cost-center.repository';

import { CreateCostCenterUseCase } from './application/use-cases/create-cost-center/create-cost-center.use-case';
import { ListCostCentersUseCase } from './application/use-cases/list-cost-centers/list-cost-centers.use-case';
import { FindCostCenterByIdUseCase } from './application/use-cases/find-cost-center-by-id/find-cost-center-by-id.use-case';
import { UpdateCostCenterUseCase } from './application/use-cases/update-cost-center/update-cost-center.use-case';
import { DeleteCostCenterUseCase } from './application/use-cases/delete-cost-center/delete-cost-center.use-case';
import { RestoreCostCenterUseCase } from './application/use-cases/restore-cost-center/restore-cost-center.use-case';

import { ListCostCentersRoute } from './infrastructure/http/routes/list-cost-centers/list-cost-centers.route';
import { CreateCostCenterRoute } from './infrastructure/http/routes/create-cost-center/create-cost-center.route';
import { RestoreCostCenterRoute } from './infrastructure/http/routes/restore-cost-center/restore-cost-center.route';
import { FindCostCenterByIdRoute } from './infrastructure/http/routes/find-cost-center-by-id/find-cost-center-by-id.route';
import { UpdateCostCenterRoute } from './infrastructure/http/routes/update-cost-center/update-cost-center.route';
import { DeleteCostCenterRoute } from './infrastructure/http/routes/delete-cost-center/delete-cost-center.route';

/**
 * Centros de custo da organização — a que área um lançamento pertence.
 */
@Module({
  // Ordem importa: as rotas de caminho fixo antes de `:id`, para o Nest não
  // tratar um segmento fixo como parâmetro.
  controllers: [
    ListCostCentersRoute,
    CreateCostCenterRoute,
    RestoreCostCenterRoute,
    FindCostCenterByIdRoute,
    UpdateCostCenterRoute,
    DeleteCostCenterRoute,
  ],
  providers: [
    { provide: CostCenterRepository, useClass: PrismaCostCenterRepository },
    CreateCostCenterUseCase,
    ListCostCentersUseCase,
    FindCostCenterByIdUseCase,
    UpdateCostCenterUseCase,
    DeleteCostCenterUseCase,
    RestoreCostCenterUseCase,
  ],
  exports: [CostCenterRepository],
})
export class CostCentersModule {}
