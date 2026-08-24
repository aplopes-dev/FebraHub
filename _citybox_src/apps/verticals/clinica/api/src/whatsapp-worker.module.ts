import { Module } from '@nestjs/common';
import { PrismaModule } from './shared/infra/prisma/prisma.module';
import { ClinicStoreProfileRepository } from './modules/clinic-profile/domain/repositories/clinic-store-profile.repository.interface';
import { PrismaClinicStoreProfileRepository } from './modules/clinic-profile/infrastructure/database/prisma-clinic-store-profile.repository';
import { CampaignRepository } from './modules/marketing/campaigns/domain/repositories/campaign.repository';
import { PrismaCampaignRepository } from './modules/marketing/campaigns/infrastructure/database/prisma-campaign.repository';
import { PatientRepository } from './modules/patients/domain/repositories/patient.repository.interface';
import { PrismaPatientRepository } from './modules/patients/infrastructure/database/prisma-patient.repository';
import { AppointmentRepository } from './modules/scheduling/appointments/domain/repositories/appointment.repository.interface';
import { PrismaAppointmentRepository } from './modules/scheduling/appointments/infrastructure/database/prisma-appointment.repository';
import { WhatsappEventPublisher } from './modules/whatsapp/application/services/whatsapp-event-publisher';
import { DispatchDueAppointmentRemindersUseCase } from './modules/whatsapp/application/use-cases/dispatch-due-appointment-reminders/dispatch-due-appointment-reminders.use-case';
import { DispatchDueBirthdayCampaignsUseCase } from './modules/whatsapp/application/use-cases/dispatch-due-birthday-campaigns/dispatch-due-birthday-campaigns.use-case';
import { ProcessWhatsappInboundUseCase } from './modules/whatsapp/application/use-cases/process-inbound/process-whatsapp-inbound.use-case';
import { BirthdayCampaignPatientRepository } from './modules/whatsapp/domain/repositories/birthday-campaign-patient.repository.interface';
import { WhatsappConnectionRepository } from './modules/whatsapp/domain/repositories/whatsapp-connection.repository.interface';
import { WhatsappMessageRepository } from './modules/whatsapp/domain/repositories/whatsapp-message.repository.interface';
import { WhatsappTemplateRepository } from './modules/whatsapp/domain/repositories/whatsapp-template.repository.interface';
import { PrismaBirthdayCampaignPatientRepository } from './modules/whatsapp/infrastructure/database/prisma-birthday-campaign-patient.repository';
import { PrismaWhatsappConnectionRepository } from './modules/whatsapp/infrastructure/database/prisma-whatsapp-connection.repository';
import { PrismaWhatsappMessageRepository } from './modules/whatsapp/infrastructure/database/prisma-whatsapp-message.repository';
import { PrismaWhatsappTemplateRepository } from './modules/whatsapp/infrastructure/database/prisma-whatsapp-template.repository';
import { AppointmentReminderScheduler } from './modules/whatsapp/infrastructure/messaging/appointment-reminder.scheduler';
import { BirthdayCampaignScheduler } from './modules/whatsapp/infrastructure/messaging/birthday-campaign.scheduler';
import { BaileysSessionManager } from './modules/whatsapp/infrastructure/messaging/baileys-session.manager';
import { WhatsappRabbitConsumer } from './modules/whatsapp/infrastructure/messaging/whatsapp-rabbit.consumer';

// Worker só precisa dos repositórios usados pelo inbound — importar os módulos
// de feature inteiros arrastaria dependências de HTTP/storage que não existem aqui.
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: AppointmentRepository,
      useClass: PrismaAppointmentRepository,
    },
    { provide: PatientRepository, useClass: PrismaPatientRepository },
    {
      provide: ClinicStoreProfileRepository,
      useClass: PrismaClinicStoreProfileRepository,
    },
    {
      provide: CampaignRepository,
      useClass: PrismaCampaignRepository,
    },
    {
      provide: WhatsappConnectionRepository,
      useClass: PrismaWhatsappConnectionRepository,
    },
    {
      provide: WhatsappMessageRepository,
      useClass: PrismaWhatsappMessageRepository,
    },
    {
      provide: WhatsappTemplateRepository,
      useClass: PrismaWhatsappTemplateRepository,
    },
    {
      provide: BirthdayCampaignPatientRepository,
      useClass: PrismaBirthdayCampaignPatientRepository,
    },
    WhatsappEventPublisher,
    ProcessWhatsappInboundUseCase,
    DispatchDueAppointmentRemindersUseCase,
    DispatchDueBirthdayCampaignsUseCase,
    AppointmentReminderScheduler,
    BirthdayCampaignScheduler,
    BaileysSessionManager,
    WhatsappRabbitConsumer,
  ],
})
export class WhatsappWorkerModule {}
