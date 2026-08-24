import { Module } from '@nestjs/common';
import { AppointmentCategoriesModule } from '../appointment-categories/appointment-categories.module';
import { ClientsModule } from '../clients/clients.module';
import { FinancialModule } from '../financial/financial.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ServicesModule } from '../services/services.module';
import { CreateAppointmentUseCase } from './application/use-cases/create-appointment/create-appointment.use-case';
import { ListAppointmentsUseCase } from './application/use-cases/list-appointments/list-appointments.use-case';
import { UpdateAppointmentUseCase } from './application/use-cases/update-appointment/update-appointment.use-case';
import { UpdateAppointmentStatusUseCase } from './application/use-cases/update-appointment-status/update-appointment-status.use-case';
import { AppointmentRepository } from './domain/repositories/appointment.repository.interface';
import { PrismaAppointmentRepository } from './infrastructure/database/prisma-appointment.repository';
import { CreateAppointmentRoute } from './infrastructure/http/routes/create-appointment/create-appointment.route';
import { ListAppointmentsRoute } from './infrastructure/http/routes/list-appointments/list-appointments.route';
import { UpdateAppointmentRoute } from './infrastructure/http/routes/update-appointment/update-appointment.route';
import { UpdateAppointmentStatusRoute } from './infrastructure/http/routes/update-appointment-status/update-appointment-status.route';

@Module({
  imports: [
    ClientsModule,
    TenancyModule,
    ServicesModule,
    AppointmentCategoriesModule,
    FinancialModule,
  ],
  controllers: [
    CreateAppointmentRoute,
    ListAppointmentsRoute,
    UpdateAppointmentStatusRoute,
    UpdateAppointmentRoute,
  ],
  providers: [
    {
      provide: AppointmentRepository,
      useClass: PrismaAppointmentRepository,
    },
    CreateAppointmentUseCase,
    ListAppointmentsUseCase,
    UpdateAppointmentUseCase,
    UpdateAppointmentStatusUseCase,
  ],
  exports: [AppointmentRepository],
})
export class AppointmentsModule {}
