import { Module } from '@nestjs/common';
import { AppointmentCategoryRepository } from './domain/repositories/appointment-category.repository.interface';
import { PrismaAppointmentCategoryRepository } from './infrastructure/database/prisma-appointment-category.repository';
import { ListAppointmentCategoriesUseCase } from './application/use-cases/list-appointment-categories/list-appointment-categories.use-case';
import { CreateAppointmentCategoryUseCase } from './application/use-cases/create-appointment-category/create-appointment-category.use-case';
import { UpdateAppointmentCategoryUseCase } from './application/use-cases/update-appointment-category/update-appointment-category.use-case';
import { DeleteAppointmentCategoryUseCase } from './application/use-cases/delete-appointment-category/delete-appointment-category.use-case';
import {
  CreateAppointmentCategoryRoute,
  DeleteAppointmentCategoryRoute,
  ListAppointmentCategoriesRoute,
  UpdateAppointmentCategoryRoute,
} from './infrastructure/http/routes/appointment-category.routes';

@Module({
  controllers: [
    ListAppointmentCategoriesRoute,
    CreateAppointmentCategoryRoute,
    UpdateAppointmentCategoryRoute,
    DeleteAppointmentCategoryRoute,
  ],
  providers: [
    {
      provide: AppointmentCategoryRepository,
      useClass: PrismaAppointmentCategoryRepository,
    },
    ListAppointmentCategoriesUseCase,
    CreateAppointmentCategoryUseCase,
    UpdateAppointmentCategoryUseCase,
    DeleteAppointmentCategoryUseCase,
  ],
  exports: [AppointmentCategoryRepository],
})
export class AppointmentCategoriesModule {}
