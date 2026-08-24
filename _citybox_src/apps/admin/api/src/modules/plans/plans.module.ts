import { Module } from '@nestjs/common';
import { ListPlansRoute } from './infrastructure/http/routes/list-plans/list-plans.route';
import { FindPlanByIdRoute } from './infrastructure/http/routes/find-plan-by-id/find-plan-by-id.route';
import { CreatePlanRoute } from './infrastructure/http/routes/create-plan/create-plan.route';
import { UpdatePlanRoute } from './infrastructure/http/routes/update-plan/update-plan.route';
import { DeletePlanRoute } from './infrastructure/http/routes/delete-plan/delete-plan.route';
import { ListPlansUseCase } from './application/use-cases/list-plans/list-plans.use-case';
import { FindPlanByIdUseCase } from './application/use-cases/find-plan-by-id/find-plan-by-id.use-case';
import { CreatePlanUseCase } from './application/use-cases/create-plan/create-plan.use-case';
import { UpdatePlanUseCase } from './application/use-cases/update-plan/update-plan.use-case';
import { DeletePlanUseCase } from './application/use-cases/delete-plan/delete-plan.use-case';
import { PrismaPlanRepository } from './infrastructure/database/prisma-plan.repository';
import { PlanRepository } from './domain/repositories/plan.repository.interface';

@Module({
  controllers: [
    ListPlansRoute,
    FindPlanByIdRoute,
    CreatePlanRoute,
    UpdatePlanRoute,
    DeletePlanRoute,
  ],
  providers: [
    { provide: PlanRepository, useClass: PrismaPlanRepository },
    ListPlansUseCase,
    FindPlanByIdUseCase,
    CreatePlanUseCase,
    UpdatePlanUseCase,
    DeletePlanUseCase,
  ],
  exports: [PlanRepository],
})
export class PlansModule {}
