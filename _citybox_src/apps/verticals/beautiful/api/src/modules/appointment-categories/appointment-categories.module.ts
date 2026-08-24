import { Module } from '@nestjs/common';
import { CreateAppointmentCategoryUseCase } from './application/use-cases/create-appointment-category/create-appointment-category.use-case';
import { DeleteAppointmentCategoryUseCase } from './application/use-cases/delete-appointment-category/delete-appointment-category.use-case';
import { ListAppointmentCategoriesUseCase } from './application/use-cases/list-appointment-categories/list-appointment-categories.use-case';
import { UpdateAppointmentCategoryUseCase } from './application/use-cases/update-appointment-category/update-appointment-category.use-case';
import { AppointmentCategoryRepository } from './domain/repositories/appointment-category.repository.interface';
import { PrismaAppointmentCategoryRepository } from './infrastructure/database/prisma-appointment-category.repository';
import { CreateAppointmentCategoryRoute } from './infrastructure/http/routes/create-appointment-category/create-appointment-category.route';
import { DeleteAppointmentCategoryRoute } from './infrastructure/http/routes/delete-appointment-category/delete-appointment-category.route';
import { ListAppointmentCategoriesRoute } from './infrastructure/http/routes/list-appointment-categories/list-appointment-categories.route';
import { UpdateAppointmentCategoryRoute } from './infrastructure/http/routes/update-appointment-category/update-appointment-category.route';

@Module({
  controllers: [
    CreateAppointmentCategoryRoute,
    ListAppointmentCategoriesRoute,
    UpdateAppointmentCategoryRoute,
    DeleteAppointmentCategoryRoute,
  ],
  providers: [
    {
      provide: AppointmentCategoryRepository,
      useClass: PrismaAppointmentCategoryRepository,
    },
    CreateAppointmentCategoryUseCase,
    ListAppointmentCategoriesUseCase,
    UpdateAppointmentCategoryUseCase,
    DeleteAppointmentCategoryUseCase,
  ],
  exports: [AppointmentCategoryRepository],
})
export class AppointmentCategoriesModule {}
