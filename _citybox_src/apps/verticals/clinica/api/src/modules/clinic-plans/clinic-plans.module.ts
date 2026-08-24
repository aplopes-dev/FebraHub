import { Module } from '@nestjs/common';
import { ClinicPlanRepository } from './domain/repositories/clinic-plan.repository.interface';
import { PrismaClinicPlanRepository } from './infrastructure/database/prisma-clinic-plan.repository';
import { ListClinicPlansRoute } from './infrastructure/http/routes/list-clinic-plans/list-clinic-plans.route';
import { CreateClinicPlanRoute } from './infrastructure/http/routes/create-clinic-plan/create-clinic-plan.route';
import { UpdateClinicPlanStatusRoute } from './infrastructure/http/routes/update-clinic-plan-status/update-clinic-plan-status.route';
import { GetClinicPlanByIdRoute } from './infrastructure/http/routes/get-clinic-plan-by-id/get-clinic-plan-by-id.route';
import { UpdateClinicPlanRoute } from './infrastructure/http/routes/update-clinic-plan/update-clinic-plan.route';
import { DeleteClinicPlanRoute } from './infrastructure/http/routes/delete-clinic-plan/delete-clinic-plan.route';
import { ListClinicPlansUseCase } from './application/use-cases/list-clinic-plans/list-clinic-plans.use-case';
import { GetClinicPlanByIdUseCase } from './application/use-cases/get-clinic-plan-by-id/get-clinic-plan-by-id.use-case';
import { CreateClinicPlanUseCase } from './application/use-cases/create-clinic-plan/create-clinic-plan.use-case';
import { UpdateClinicPlanUseCase } from './application/use-cases/update-clinic-plan/update-clinic-plan.use-case';
import { UpdateClinicPlanStatusUseCase } from './application/use-cases/update-clinic-plan-status/update-clinic-plan-status.use-case';
import { DeleteClinicPlanUseCase } from './application/use-cases/delete-clinic-plan/delete-clinic-plan.use-case';

@Module({
  controllers: [
    ListClinicPlansRoute,
    CreateClinicPlanRoute,
    UpdateClinicPlanStatusRoute,
    GetClinicPlanByIdRoute,
    UpdateClinicPlanRoute,
    DeleteClinicPlanRoute,
  ],
  providers: [
    { provide: ClinicPlanRepository, useClass: PrismaClinicPlanRepository },
    ListClinicPlansUseCase,
    GetClinicPlanByIdUseCase,
    CreateClinicPlanUseCase,
    UpdateClinicPlanUseCase,
    UpdateClinicPlanStatusUseCase,
    DeleteClinicPlanUseCase,
  ],
  exports: [ClinicPlanRepository],
})
export class ClinicPlansModule {}
