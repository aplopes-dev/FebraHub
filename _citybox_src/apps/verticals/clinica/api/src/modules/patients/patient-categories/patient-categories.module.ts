import { Module } from '@nestjs/common';
import { PatientCategoryRepository } from './domain/repositories/patient-category.repository.interface';
import { PrismaPatientCategoryRepository } from './infrastructure/database/prisma-patient-category.repository';
import { ListPatientCategoriesUseCase } from './application/use-cases/list-patient-categories/list-patient-categories.use-case';
import { CreatePatientCategoryUseCase } from './application/use-cases/create-patient-category/create-patient-category.use-case';
import { UpdatePatientCategoryUseCase } from './application/use-cases/update-patient-category/update-patient-category.use-case';
import { DeletePatientCategoryUseCase } from './application/use-cases/delete-patient-category/delete-patient-category.use-case';
import { ListPatientCategoriesRoute } from './infrastructure/http/routes/list-patient-categories/list-patient-categories.route';
import { CreatePatientCategoryRoute } from './infrastructure/http/routes/create-patient-category/create-patient-category.route';
import { UpdatePatientCategoryRoute } from './infrastructure/http/routes/update-patient-category/update-patient-category.route';
import { DeletePatientCategoryRoute } from './infrastructure/http/routes/delete-patient-category/delete-patient-category.route';

@Module({
  controllers: [
    ListPatientCategoriesRoute,
    CreatePatientCategoryRoute,
    UpdatePatientCategoryRoute,
    DeletePatientCategoryRoute,
  ],
  providers: [
    {
      provide: PatientCategoryRepository,
      useClass: PrismaPatientCategoryRepository,
    },
    ListPatientCategoriesUseCase,
    CreatePatientCategoryUseCase,
    UpdatePatientCategoryUseCase,
    DeletePatientCategoryUseCase,
  ],
  exports: [PatientCategoryRepository],
})
export class PatientCategoriesModule {}
