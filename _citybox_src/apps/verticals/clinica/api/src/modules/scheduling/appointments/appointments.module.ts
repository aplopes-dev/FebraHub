import { Module, forwardRef } from '@nestjs/common';
import { ClinicProfileModule } from '../../clinic-profile/clinic-profile.module';
import { PatientsModule } from '../../patients/patients.module';
import { WhatsappModule } from '../../whatsapp/whatsapp.module';
import { AppointmentRepository } from './domain/repositories/appointment.repository.interface';
import { PrismaAppointmentRepository } from './infrastructure/database/prisma-appointment.repository';
import { FitInsModule } from '../fit-ins/fit-ins.module';
import { ReturnAlertsModule } from '../return-alerts/return-alerts.module';
import { InternalEventsModule } from '../internal-events/internal-events.module';
import { AssertAppointmentSlotAvailableService } from './application/services/assert-appointment-slot-available.service';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { ReturnAlertSyncService } from './application/services/return-alert-sync.service';
import { CreateAppointmentUseCase } from './application/use-cases/create-appointment/create-appointment.use-case';
import { UpdateAppointmentUseCase } from './application/use-cases/update-appointment/update-appointment.use-case';
import { UpdateAppointmentStatusUseCase } from './application/use-cases/update-appointment-status/update-appointment-status.use-case';
import {
  DeleteAppointmentUseCase,
  GetAppointmentUseCase,
} from './application/use-cases/get-appointment/get-appointment.use-case';
import {
  GetAppointmentCalendarUseCase,
  ListAppointmentsUseCase,
} from './application/use-cases/list-appointments/list-appointments.use-case';
import {
  CreateAppointmentRoute,
  DeleteAppointmentRoute,
  GetAppointmentCalendarRoute,
  GetAppointmentRoute,
  ListAppointmentsRoute,
  UpdateAppointmentRoute,
  UpdateAppointmentStatusRoute,
} from './infrastructure/http/routes/appointment.routes';

@Module({
  imports: [
    ClinicProfileModule,
    PatientsModule,
    FitInsModule,
    ReturnAlertsModule,
    forwardRef(() => InternalEventsModule),
    forwardRef(() => WhatsappModule),
  ],
  controllers: [
    ListAppointmentsRoute,
    GetAppointmentCalendarRoute,
    GetAppointmentRoute,
    CreateAppointmentRoute,
    UpdateAppointmentRoute,
    UpdateAppointmentStatusRoute,
    DeleteAppointmentRoute,
  ],
  providers: [
    {
      provide: AppointmentRepository,
      useClass: PrismaAppointmentRepository,
    },
    AssertPatientExistsService,
    AssertAppointmentSlotAvailableService,
    ReturnAlertSyncService,
    CreateAppointmentUseCase,
    UpdateAppointmentUseCase,
    UpdateAppointmentStatusUseCase,
    GetAppointmentUseCase,
    DeleteAppointmentUseCase,
    ListAppointmentsUseCase,
    GetAppointmentCalendarUseCase,
  ],
  exports: [AppointmentRepository],
})
export class AppointmentsModule {}
