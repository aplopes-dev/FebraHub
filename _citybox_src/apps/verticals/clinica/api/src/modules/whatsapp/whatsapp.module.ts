import { Module, forwardRef } from '@nestjs/common';
import { ClinicProfileModule } from '../clinic-profile/clinic-profile.module';
import { CampaignsModule } from '../marketing/campaigns/campaigns.module';
import { PatientsModule } from '../patients/patients.module';
import { AppointmentsModule } from '../scheduling/appointments/appointments.module';
import { WhatsappEventPublisher } from './application/services/whatsapp-event-publisher';
import { DisconnectWhatsappSessionUseCase } from './application/use-cases/disconnect-session/disconnect-whatsapp-session.use-case';
import { DispatchDueBirthdayCampaignsUseCase } from './application/use-cases/dispatch-due-birthday-campaigns/dispatch-due-birthday-campaigns.use-case';
import { EnqueueAppointmentConfirmationUseCase } from './application/use-cases/enqueue-appointment-confirmation/enqueue-appointment-confirmation.use-case';
import { GetWhatsappSessionUseCase } from './application/use-cases/get-session/get-whatsapp-session.use-case';
import { ListPatientWhatsappMessagesUseCase } from './application/use-cases/list-patient-messages/list-patient-whatsapp-messages.use-case';
import { ListWhatsappTemplatesUseCase } from './application/use-cases/list-templates/list-whatsapp-templates.use-case';
import { ProcessWhatsappInboundUseCase } from './application/use-cases/process-inbound/process-whatsapp-inbound.use-case';
import { RequestWhatsappQrUseCase } from './application/use-cases/request-qr/request-whatsapp-qr.use-case';
import { UpdateWhatsappTemplatesUseCase } from './application/use-cases/update-templates/update-whatsapp-templates.use-case';
import { BirthdayCampaignPatientRepository } from './domain/repositories/birthday-campaign-patient.repository.interface';
import { WhatsappConnectionRepository } from './domain/repositories/whatsapp-connection.repository.interface';
import { WhatsappMessageRepository } from './domain/repositories/whatsapp-message.repository.interface';
import { WhatsappTemplateRepository } from './domain/repositories/whatsapp-template.repository.interface';
import { PrismaBirthdayCampaignPatientRepository } from './infrastructure/database/prisma-birthday-campaign-patient.repository';
import { PrismaWhatsappConnectionRepository } from './infrastructure/database/prisma-whatsapp-connection.repository';
import { PrismaWhatsappMessageRepository } from './infrastructure/database/prisma-whatsapp-message.repository';
import { PrismaWhatsappTemplateRepository } from './infrastructure/database/prisma-whatsapp-template.repository';
import { PatientWhatsappMessagesRoute } from './infrastructure/http/routes/patient-messages/patient-whatsapp-messages.route';
import { WhatsappSessionRoute } from './infrastructure/http/routes/session/whatsapp-session.route';
import { WhatsappTemplatesRoute } from './infrastructure/http/routes/templates/whatsapp-templates.route';

@Module({
  imports: [
    ClinicProfileModule,
    PatientsModule,
    forwardRef(() => AppointmentsModule),
    forwardRef(() => CampaignsModule),
  ],
  controllers: [
    WhatsappSessionRoute,
    WhatsappTemplatesRoute,
    PatientWhatsappMessagesRoute,
  ],
  providers: [
    {
      provide: WhatsappConnectionRepository,
      useClass: PrismaWhatsappConnectionRepository,
    },
    {
      provide: WhatsappTemplateRepository,
      useClass: PrismaWhatsappTemplateRepository,
    },
    {
      provide: WhatsappMessageRepository,
      useClass: PrismaWhatsappMessageRepository,
    },
    {
      provide: BirthdayCampaignPatientRepository,
      useClass: PrismaBirthdayCampaignPatientRepository,
    },
    WhatsappEventPublisher,
    GetWhatsappSessionUseCase,
    RequestWhatsappQrUseCase,
    DisconnectWhatsappSessionUseCase,
    ListWhatsappTemplatesUseCase,
    UpdateWhatsappTemplatesUseCase,
    EnqueueAppointmentConfirmationUseCase,
    ProcessWhatsappInboundUseCase,
    ListPatientWhatsappMessagesUseCase,
    DispatchDueBirthdayCampaignsUseCase,
  ],
  exports: [
    EnqueueAppointmentConfirmationUseCase,
    ProcessWhatsappInboundUseCase,
    DispatchDueBirthdayCampaignsUseCase,
    WhatsappConnectionRepository,
    WhatsappMessageRepository,
    WhatsappTemplateRepository,
    WhatsappEventPublisher,
  ],
})
export class WhatsappModule {}
