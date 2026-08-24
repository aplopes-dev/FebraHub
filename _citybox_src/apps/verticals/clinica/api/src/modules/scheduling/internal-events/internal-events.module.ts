import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { FitInsModule } from '../fit-ins/fit-ins.module';
import { InternalEventRepository } from './domain/repositories/internal-event.repository.interface';
import { PrismaInternalEventRepository } from './infrastructure/database/prisma-internal-event.repository';
import { DisplaceAppointmentsForCommitmentService } from './application/services/displace-appointments-for-commitment.service';
import { CreateInternalEventUseCase } from './application/use-cases/create-internal-event/create-internal-event.use-case';
import { UpdateInternalEventUseCase } from './application/use-cases/update-internal-event/update-internal-event.use-case';
import {
  DeleteInternalEventUseCase,
  GetInternalEventUseCase,
} from './application/use-cases/get-internal-event/get-internal-event.use-case';
import { ListInternalEventsUseCase } from './application/use-cases/list-internal-events/list-internal-events.use-case';
import {
  CreateInternalEventRoute,
  DeleteInternalEventRoute,
  GetInternalEventRoute,
  ListInternalEventsRoute,
  UpdateInternalEventRoute,
} from './infrastructure/http/routes/internal-event.routes';

@Module({
  imports: [forwardRef(() => AppointmentsModule), FitInsModule],
  controllers: [
    ListInternalEventsRoute,
    GetInternalEventRoute,
    CreateInternalEventRoute,
    UpdateInternalEventRoute,
    DeleteInternalEventRoute,
  ],
  providers: [
    {
      provide: InternalEventRepository,
      useClass: PrismaInternalEventRepository,
    },
    DisplaceAppointmentsForCommitmentService,
    CreateInternalEventUseCase,
    UpdateInternalEventUseCase,
    GetInternalEventUseCase,
    DeleteInternalEventUseCase,
    ListInternalEventsUseCase,
  ],
  exports: [InternalEventRepository],
})
export class InternalEventsModule {}
