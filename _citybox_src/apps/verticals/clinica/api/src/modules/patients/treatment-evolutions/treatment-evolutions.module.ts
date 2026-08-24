import { Module } from '@nestjs/common';
import { PatientRepository } from '../domain/repositories/patient.repository.interface';
import { PrismaPatientRepository } from '../infrastructure/database/prisma-patient.repository';
import { TreatmentEvolutionRepository } from './domain/repositories/treatment-evolution.repository.interface';
import { PrismaTreatmentEvolutionRepository } from './infrastructure/database/prisma-treatment-evolution.repository';
import { ListTreatmentEvolutionsUseCase } from './application/use-cases/list-evolutions/list-evolutions.use-case';
import { CreateTreatmentEvolutionUseCase } from './application/use-cases/create-evolution/create-evolution.use-case';
import { UpdateTreatmentEvolutionUseCase } from './application/use-cases/update-evolution/update-evolution.use-case';
import { DeleteTreatmentEvolutionUseCase } from './application/use-cases/delete-evolution/delete-evolution.use-case';
import { GetEvolutionHistoryUseCase } from './application/use-cases/get-evolution-history/get-evolution-history.use-case';
import { ListTreatmentEvolutionsRoute } from './infrastructure/http/routes/list-evolutions/list-evolutions.route';
import { CreateTreatmentEvolutionRoute } from './infrastructure/http/routes/create-evolution/create-evolution.route';
import { UpdateTreatmentEvolutionRoute } from './infrastructure/http/routes/update-evolution/update-evolution.route';
import { DeleteTreatmentEvolutionRoute } from './infrastructure/http/routes/delete-evolution/delete-evolution.route';
import { GetEvolutionHistoryRoute } from './infrastructure/http/routes/get-evolution-history/get-evolution-history.route';

@Module({
  controllers: [
    ListTreatmentEvolutionsRoute,
    CreateTreatmentEvolutionRoute,
    UpdateTreatmentEvolutionRoute,
    DeleteTreatmentEvolutionRoute,
    GetEvolutionHistoryRoute,
  ],
  providers: [
    {
      provide: TreatmentEvolutionRepository,
      useClass: PrismaTreatmentEvolutionRepository,
    },
    { provide: PatientRepository, useClass: PrismaPatientRepository },
    ListTreatmentEvolutionsUseCase,
    CreateTreatmentEvolutionUseCase,
    UpdateTreatmentEvolutionUseCase,
    DeleteTreatmentEvolutionUseCase,
    GetEvolutionHistoryUseCase,
  ],
  exports: [TreatmentEvolutionRepository],
})
export class TreatmentEvolutionsModule {}
