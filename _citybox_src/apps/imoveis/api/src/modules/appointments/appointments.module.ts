import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { AppointmentRepository } from './domain/repositories/appointment.repository.interface';
import { PrismaAppointmentRepository } from './infrastructure/database/prisma-appointment.repository';
import { ListAppointmentsRoute } from './infrastructure/http/routes/list-appointments/list-appointments.route';
import { GetAppointmentByIdRoute } from './infrastructure/http/routes/get-appointment-by-id/get-appointment-by-id.route';
import { CreateAppointmentRoute } from './infrastructure/http/routes/create-appointment/create-appointment.route';
import { UpdateAppointmentRoute } from './infrastructure/http/routes/update-appointment/update-appointment.route';
import { DeleteAppointmentRoute } from './infrastructure/http/routes/delete-appointment/delete-appointment.route';
import { ListAppointmentsUseCase } from './application/use-cases/list-appointments/list-appointments.use-case';
import { GetAppointmentByIdUseCase } from './application/use-cases/get-appointment-by-id/get-appointment-by-id.use-case';
import { CreateAppointmentUseCase } from './application/use-cases/create-appointment/create-appointment.use-case';
import { UpdateAppointmentUseCase } from './application/use-cases/update-appointment/update-appointment.use-case';
import { DeleteAppointmentUseCase } from './application/use-cases/delete-appointment/delete-appointment.use-case';

@Module({
  imports: [PrismaModule, GoogleCalendarModule],
  controllers: [
    ListAppointmentsRoute,
    GetAppointmentByIdRoute,
    CreateAppointmentRoute,
    UpdateAppointmentRoute,
    DeleteAppointmentRoute,
  ],
  providers: [
    { provide: AppointmentRepository, useClass: PrismaAppointmentRepository },
    ListAppointmentsUseCase,
    GetAppointmentByIdUseCase,
    CreateAppointmentUseCase,
    UpdateAppointmentUseCase,
    DeleteAppointmentUseCase,
  ],
  exports: [AppointmentRepository],
})
export class AppointmentsModule {}
